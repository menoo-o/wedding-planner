// app/dashboard/components/LoanForm.tsx
"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, AlertCircle, FileText } from "lucide-react"

type LoanFormData = {
  household_id: string
  cycle_id: string
  created_by: string
  loan_type: "loan_in" | "loan_out"
  amount: number
  payment_account: "cash" | "card"
  counterparty_name: string
  description: string
  transaction_date: string
}

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
}

export default function LoanForm({
  householdId,
  currentCycleId,
  createdBy,
  cashBalance,
  cardBalance,
  onSuccess,
}: LoanFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [dbError, setDbError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormData>({
    mode: "onChange",
    defaultValues: {
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      loan_type: "loan_in",
      amount: undefined,
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
    setDbError(null)

    if (!data.cycle_id || !data.household_id) {
      setDbError("System error: Missing ledger identifiers.")
      return
    }

    const chosenDate = new Date(data.transaction_date)
    const now = new Date()

    if (data.transaction_date === getTodayString()) {
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      chosenDate.setHours(12, 0, 0)
    }

    const cleanPayload = {
      household_id: data.household_id,
      cycle_id: data.cycle_id,
      created_by: data.created_by,
      transaction_type: data.loan_type,
      payment_account: data.payment_account,
      amount: data.amount,
      counterparty_name: data.counterparty_name.trim(),
      description:
        data.description.trim() ||
        `${data.loan_type === "loan_in" ? "Borrowed from" : "Lent to"} ${data.counterparty_name}`,
      paid_by: null,
      created_at: chosenDate.toISOString(),
      category_id: null,
      notes: null,
    }

    const { error } = await supabase.from("transactions").insert(cleanPayload)

    if (error) {
      setDbError(error.message)
      return
    }

    reset({
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      loan_type: "loan_in",
      amount: undefined,
      payment_account: "cash",
      counterparty_name: "",
      description: "",
      transaction_date: getTodayString(),
    })

    onSuccess?.()
    router.refresh()
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
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            type="button"
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
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
        <input
          type="date"
          {...register("transaction_date", { required: "Date is required" })}
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
          {...register("counterparty_name", { required: "Name is required" })}
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
            {...register("amount", {
              required: "Amount is required",
              valueAsNumber: true,
              validate: {
                positive: (v) => v > 0 || "Must be greater than zero",
                overdraft: (v) =>
                  selectedLoanType !== "loan_out" ||
                  v <= executionLimit ||
                  `Insufficient funds. Only Rs ${executionLimit.toLocaleString()} available in ${selectedAccount}.`,
              },
            })}
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
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            type="button"
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