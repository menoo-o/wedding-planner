// app/dashboard/components/LoanForm.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, AlertCircle, FileText } from "lucide-react"
import {
  LoanFormSchema,
  LoanFormData,
  LoanTransactionInsertSchema,
} from "@/app/dashboard/_lib/loanFormSchema"

function getTodayString() {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

interface LoanFormProps {
  householdId: string
  currentCycleId: string
  createdBy: string
  cashBalance: number
  cardBalance: number
  onSuccess?: () => void
  showToast: (type: "success" | "error" | "info", title: string, message: string) => void
}

export default function LoanForm({
  householdId,
  currentCycleId,
  createdBy,
  cashBalance,
  cardBalance,
  showToast,
  onSuccess,
}: LoanFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [dbError, setDbError] = useState<string | null>(null)
  // Guards against double-submit from a fast double-click landing before
  // isSubmitting re-renders the disabled button.
  const submittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormData>({
    resolver: zodResolver(LoanFormSchema),
    mode: "onChange",
    defaultValues: {
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      loan_type: "loan_in",
      amount: undefined as unknown as number,
      payment_account: "cash",
      counterparty_name: "",
      description: "",
      transaction_date: getTodayString(),
    },
  })

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
    }))
  }, [householdId, currentCycleId, createdBy, reset])

  const selectedLoanType = watch("loan_type")
  const selectedAccount = watch("payment_account")
  const executionLimit = selectedAccount === "cash" ? cashBalance : cardBalance

  async function onSubmit(data: LoanFormData) {
    if (submittingRef.current) return
    submittingRef.current = true

    try {
      // 1. Session / Ledger Guard
      if (!householdId || !currentCycleId || !createdBy) {
        showToast("error", "Configuration Error", "Missing active ledger. Please refresh.")
        return
      }
      setDbError(null)

      // 2. Liquidity check for lending out
      // NOTE: reads cashBalance/cardBalance passed down as props — advisory
      // client-side check only, not a guard against two submissions racing
      // on the same stale balance. Closing that gap needs a DB-level check.
      if (data.loan_type === "loan_out" && data.amount > executionLimit) {
        showToast(
          "error",
          "Insufficient Balance",
          `You only have Rs ${executionLimit.toLocaleString()} in your ${data.payment_account.toUpperCase()} account.`
        )
        return
      }

      // 3. Form schema validation check
      const parsed = LoanFormSchema.safeParse(data)
      if (!parsed.success) {
        console.error("Validation failed:", parsed.error.issues)
        showToast("error", "Validation Failed", "Please check your input and try again.")
        return
      }

      // 4. Build timestamp — stay in local time throughout instead of mixing
      // UTC-midnight parsing (new Date("YYYY-MM-DD")) with local setHours(),
      // which could silently shift the stored date by a day near midnight
      // depending on the user's UTC offset.
      const [year, month, day] = data.transaction_date.split("-").map(Number)
      const now = new Date()
      const chosenDate =
        data.transaction_date === getTodayString()
          ? new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
          : new Date(year, month - 1, day, 12, 0, 0)

      // 5. Build DB Insert payload
      const formattedDescription =
        data.description.trim() ||
        `${data.loan_type === "loan_in" ? "Borrowed from" : "Lent to"} ${data.counterparty_name.trim()}`

      const isLendingOut = data.loan_type === "loan_out"

      const payload = {
        household_id: data.household_id,
        cycle_id: data.cycle_id,
        created_by: data.created_by,
        transaction_type: data.loan_type,
        amount: data.amount,
        payment_account: data.payment_account,
        counterparty_name: data.counterparty_name.trim(),
        description: formattedDescription,
        paid_by: isLendingOut ? "household" : "someone_else",
        loan_status: "pending" as const, // parent debt row starts pending; status is
                                          // recomputed from repayments at read time,
                                          // never written to again after this insert.
        related_transaction_id: null,    // root/parent row
        category_id: null,
        notes: null,
        created_at: chosenDate.toISOString(),
      }

      const txParsed = LoanTransactionInsertSchema.safeParse(payload)
      if (!txParsed.success) {
        console.error("Payload validation failed:", txParsed.error.issues)
        showToast("error", "Payload Invalid", "Failed to construct valid transaction records.")
        return
      }

      // 6. DB Write
      const { error } = await supabase.from("transactions").insert(txParsed.data)

      if (error) {
        setDbError(error.message)
        showToast("error", "Failed to Record", error.message)
        return
      }

      // 7. Success Toast notification
      const isBorrowing = data.loan_type === "loan_in"
      showToast(
        "success",
        isBorrowing ? "Loan Received" : "Loan Lent Out",
        isBorrowing
          ? `Rs ${data.amount.toLocaleString()} received from ${data.counterparty_name.trim()}`
          : `Rs ${data.amount.toLocaleString()} lent to ${data.counterparty_name.trim()}`
      )

      // 8. Form reset and transition
      reset({
        household_id: householdId,
        cycle_id: currentCycleId,
        created_by: createdBy,
        loan_type: "loan_in",
        amount: undefined as unknown as number,
        payment_account: "cash",
        counterparty_name: "",
        description: "",
        transaction_date: getTodayString(),
      })

      onSuccess?.()
      router.refresh()
    } catch (err) {
      // Catches thrown errors (network failure, timeout, offline) that
      // Supabase's { error } return value wouldn't surface.
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setDbError(message)
      showToast("error", "Failed to Record", message)
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("household_id")} />
      <input type="hidden" {...register("cycle_id")} />
      <input type="hidden" {...register("created_by")} />

      {/* Error Banner */}
      {dbError && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-medium flex items-start gap-2">
          <AlertCircle size={14} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
          {dbError}
        </div>
      )}

      {/* Loan Type Toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Transaction type</label>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200" role="radiogroup" aria-label="Transaction type">
          <button
            type="button"
            role="radio"
            aria-checked={selectedLoanType === "loan_in"}
            onClick={() => setValue("loan_type", "loan_in")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
              selectedLoanType === "loan_in"
                ? "bg-white text-[#2d3436] shadow-sm"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <ArrowDownLeft size={16} strokeWidth={1.8} />
            Borrowed (in)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedLoanType === "loan_out"}
            onClick={() => setValue("loan_type", "loan_out")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
              selectedLoanType === "loan_out"
                ? "bg-white text-[#2d3436] shadow-sm"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <ArrowUpRight size={16} strokeWidth={1.8} />
            Lent (out)
          </button>
        </div>
        {errors.loan_type && (
          <p className="text-red-500 text-xs mt-1.5">{errors.loan_type.message}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
        <input
          type="date"
          {...register("transaction_date")}
          suppressHydrationWarning
          className={`w-full h-11 px-3.5 border rounded-xl text-[15px] outline-none transition-all ${
            errors.transaction_date
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04]"
          }`}
        />
        {errors.transaction_date && (
          <p className="text-red-500 text-xs mt-1.5">{errors.transaction_date.message}</p>
        )}
      </div>

      {/* Counterparty */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {selectedLoanType === "loan_in" ? "Lender's name" : "Borrower's name"}
        </label>
        <input
          type="text"
          placeholder="e.g. Ali Ahmed, Zain, Bank ABC"
          {...register("counterparty_name")}
          className={`w-full h-11 px-3.5 border rounded-xl text-[15px] outline-none transition-all ${
            errors.counterparty_name
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04]"
          }`}
        />
        {errors.counterparty_name && (
          <p className="text-red-500 text-xs mt-1.5">{errors.counterparty_name.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-medium text-gray-500">Amount</label>
          {selectedLoanType === "loan_out" && (
            <span className="text-[11px] font-medium text-gray-400">
              Available: Rs {executionLimit.toLocaleString()}
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-gray-400 pointer-events-none">
            Rs
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount", { valueAsNumber: true })}
            className={`w-full h-[52px] pl-11 pr-3.5 border rounded-xl text-[22px] font-medium tabular-nums outline-none transition-all ${
              errors.amount
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04]"
            }`}
          />
        </div>
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1.5">{errors.amount.message}</p>
        )}
      </div>

      {/* Account */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          {selectedLoanType === "loan_in" ? "Deposit to" : "Withdraw from"}
        </label>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200" role="radiogroup" aria-label="Payment account">
          <button
            type="button"
            role="radio"
            aria-checked={selectedAccount === "cash"}
            onClick={() => setValue("payment_account", "cash")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
              selectedAccount === "cash"
                ? "bg-white text-[#2d3436] shadow-sm"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <Wallet size={16} strokeWidth={1.8} />
            Cash
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedAccount === "card"}
            onClick={() => setValue("payment_account", "card")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
              selectedAccount === "card"
                ? "bg-white text-[#2d3436] shadow-sm"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <CreditCard size={16} strokeWidth={1.8} />
            Card
          </button>
        </div>
        {errors.payment_account && (
          <p className="text-red-500 text-xs mt-1.5">{errors.payment_account.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description / memo</label>
        <div className="relative">
          <FileText size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          <input
            type="text"
            placeholder="e.g. Emergency business backing"
            {...register("description")}
            className="w-full h-11 pl-10 pr-3.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04] transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 font-medium text-sm transition-all border border-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 rounded-xl bg-[#2d3436] hover:opacity-90 disabled:opacity-40 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? "Saving..." : "Record loan"}
        </button>
      </div>
    </form>
  )
}