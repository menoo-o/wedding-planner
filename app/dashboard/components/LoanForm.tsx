// app/dashboard/components/LoanForm.tsx
"use client"
"use no memo"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type LoanFormData = {
  household_id: string
  cycle_id: string
  created_by: string
  loan_type: "loan_in" | "loan_out"
  amount: number
  payment_account: "cash" | "card" | "personal"
  counterparty_name: string
  description: string
  transaction_date: string // 👈 NEW: Form date tracking key
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
}

export default function LoanForm({ householdId, currentCycleId, createdBy, cashBalance, cardBalance }: LoanFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
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
      transaction_date: getTodayString(), // 👈 NEW: Default to today's raw calendar string
    }
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
      setDbError("System Error: Reference tracking markers are missing.")
      return
    }

    // 🏆 NEW: LOCALIZED TIMESTAMP GENERATOR
    const chosenDate = new Date(data.transaction_date)
    const now = new Date()
    
    if (data.transaction_date === getTodayString()) {
      // If logging for today, mix in current live hour/min/sec so timeline sorting is pristine
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      // If logging historical data, drop it right in the middle of that calendar day
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
      description: data.description.trim() || `${data.loan_type === "loan_in" ? "Borrowed from" : "Lent to"} ${data.counterparty_name}`,
      paid_by: null,
      created_at: chosenDate.toISOString(), // 👈 OVERRIDING SUPABASE DEFAULT RULES
      category_id: null,
      notes: null,
    }

    const { error } = await supabase
      .from("transactions")
      .insert(cleanPayload)

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
      transaction_date: getTodayString(), // Reset calendar back to default today
    })
    setIsOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
      >
        Debt / Loans
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6 relative border border-gray-100">
            
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record Debt Transaction</h2>
                <p className="text-xs text-gray-500">Log borrowing or lending entries safely.</p>
              </div>

              {dbError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-medium">
                  Database Constraint Error: {dbError}
                </div>
              )}

              {/* Transaction Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Loan Strategy</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => reset((prev) => ({ ...prev, loan_type: "loan_in" }))}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all ${selectedLoanType === "loan_in" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"}`}
                  >
                    Borrow Money (Loan In)
                  </button>
                  <button
                    type="button"
                    onClick={() => reset((prev) => ({ ...prev, loan_type: "loan_out" }))}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all ${selectedLoanType === "loan_out" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"}`}
                  >
                    Lend Money (Loan Out)
                  </button>
                </div>
              </div>

              {/* 📅 NEW FIELD: Dynamic Date Input Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction Date *</label>
                <input
                  type="date"
                  {...register("transaction_date", { required: "A calendar ledger date entry is mandatory." })}
                  suppressHydrationWarning
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.transaction_date && <p className="text-red-500 text-xs mt-1">⚠️ {errors.transaction_date.message}</p>}
              </div>

              {/* Counterparty Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {selectedLoanType === "loan_in" ? "Lender's Name (Who gave it?) *" : "Borrower's Name (Who took it?) *"}
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ali Ahmed, Zain, Bank ABC"
                  {...register("counterparty_name", { required: "Person identity field is mandatory." })}
                  className={`w-full border p-2 rounded-lg text-sm outline-none ${errors.counterparty_name ? "border-red-500 bg-red-50" : "border-gray-300 focus:ring-2 focus:ring-amber-500"}`}
                />
                {errors.counterparty_name && <p className="text-red-500 text-xs mt-1">⚠️ {errors.counterparty_name.message}</p>}
              </div>

              {/* Amount Field with Dynamic Holding Checks */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Amount *</label>
                  {selectedLoanType === "loan_out" && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Max Available: Rs. {executionLimit}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount", {
                    required: "Amount value is required.",
                    valueAsNumber: true,
                    validate: {
                      positive: (v) => v > 0 || "Value must be greater than zero.",
                      overdraft: (v) => 
                        selectedLoanType !== "loan_out" || 
                        v <= executionLimit || 
                        `Insufficient funds! Vault only holds Rs. ${executionLimit} in ${selectedAccount.toUpperCase()}.`
                    }
                  })}
                  className={`w-full border p-2 rounded-lg text-base font-medium outline-none ${errors.amount ? "border-red-500 bg-red-50" : "border-gray-300 focus:ring-2 focus:ring-amber-500"}`}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">⚠️ {errors.amount.message}</p>}
              </div>

              {/* Target/Source Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {selectedLoanType === "loan_in" ? "Deposit Destination" : "Funding Resource Outflow"}
                </label>
                <div className="flex gap-4 p-2 bg-gray-50 border rounded-lg border-gray-200">
                  <label className="text-xs font-medium flex items-center cursor-pointer select-none text-gray-700">
                    <input type="radio" value="cash" {...register("payment_account")} className="mr-1.5 accent-amber-600" />
                    Physical Cash Box
                  </label>
                  <label className="text-xs font-medium flex items-center cursor-pointer select-none text-gray-700">
                    <input type="radio" value="card" {...register("payment_account")} className="mr-1.5 accent-amber-600" />
                    Bank Account Card
                  </label>
                </div>
              </div>

              {/* Description Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g., Emergency business backing"
                  {...register("description")}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !!errors.amount}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Writing Entry..." : "Log Loan Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}