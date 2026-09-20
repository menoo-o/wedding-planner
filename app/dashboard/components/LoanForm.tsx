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

import {
  labelCls, errorCls, inputCls, dateFixCls,
  optionGridCls, optionCls, cancelBtnCls, submitBtnCls,
} from "@/app/dashboard/_lib/formStyles"

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("household_id")} />
      <input type="hidden" {...register("cycle_id")} />
      <input type="hidden" {...register("created_by")} />

      {/* Error Banner */}
      {dbError && (
        <div className="p-3.5 bg-red-50 text-red-600 text-xs rounded-2xl border border-red-100 font-medium flex items-start gap-2">
          <AlertCircle size={14} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
          {dbError}
        </div>
      )}

      {/* Loan Type */}
      <div className="space-y-2">
        <label className={labelCls}>Transaction type</label>
        <div className={optionGridCls} role="radiogroup" aria-label="Transaction type">
          <button
            type="button"
            role="radio"
            aria-checked={selectedLoanType === "loan_in"}
            onClick={() => setValue("loan_type", "loan_in")}
            className={optionCls(selectedLoanType === "loan_in")}
          >
            <ArrowDownLeft size={16} strokeWidth={1.8} />
            Borrowed (in)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedLoanType === "loan_out"}
            onClick={() => setValue("loan_type", "loan_out")}
            className={optionCls(selectedLoanType === "loan_out")}
          >
            <ArrowUpRight size={16} strokeWidth={1.8} />
            Lent (out)
          </button>
        </div>
        {errors.loan_type && <p className={errorCls}>{errors.loan_type.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className={labelCls}>Date</label>
        <input
          type="date"
          {...register("transaction_date")}
          suppressHydrationWarning
          className={`${inputCls(!!errors.transaction_date)} ${dateFixCls}`}
        />
        {errors.transaction_date && <p className={errorCls}>{errors.transaction_date.message}</p>}
      </div>

      {/* Counterparty */}
      <div className="space-y-2">
        <label className={labelCls}>
          {selectedLoanType === "loan_in" ? "Lender's name" : "Borrower's name"}
        </label>
        <input
          type="text"
          placeholder="e.g. Ali Ahmed, Zain, Bank ABC"
          {...register("counterparty_name")}
          className={inputCls(!!errors.counterparty_name)}
        />
        {errors.counterparty_name && <p className={errorCls}>{errors.counterparty_name.message}</p>}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className={labelCls}>Amount</label>
          {selectedLoanType === "loan_out" && (
            <span className="text-[11px] font-medium text-gray-400 text-right">
              Available: Rs {executionLimit.toLocaleString()}
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-400 pointer-events-none">
            Rs
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            {...register("amount", { valueAsNumber: true })}
            className={`${inputCls(!!errors.amount, "pl-14 pr-4", "h-14")} !text-xl font-bold tabular-nums`}
          />
        </div>
        {errors.amount && <p className={errorCls}>{errors.amount.message}</p>}
      </div>

      {/* Account */}
      <div className="space-y-2">
        <label className={labelCls}>
          {selectedLoanType === "loan_in" ? "Deposit to" : "Withdraw from"}
        </label>
        <div className={optionGridCls} role="radiogroup" aria-label="Payment account">
          <button
            type="button"
            role="radio"
            aria-checked={selectedAccount === "cash"}
            onClick={() => setValue("payment_account", "cash")}
            className={optionCls(selectedAccount === "cash")}
          >
            <Wallet size={16} strokeWidth={1.8} />
            Cash
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedAccount === "card"}
            onClick={() => setValue("payment_account", "card")}
            className={optionCls(selectedAccount === "card")}
          >
            <CreditCard size={16} strokeWidth={1.8} />
            Card
          </button>
        </div>
        {errors.payment_account && <p className={errorCls}>{errors.payment_account.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className={labelCls}>Description / memo</label>
        <div className="relative">
          <FileText size={16} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="e.g. Emergency business backing"
            {...register("description")}
            className={inputCls(false, "pl-11 pr-4")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onSuccess} className={cancelBtnCls}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className={submitBtnCls}>
          {isSubmitting ? "Saving..." : "Record loan"}
        </button>
      </div>
    </form>
  )
}