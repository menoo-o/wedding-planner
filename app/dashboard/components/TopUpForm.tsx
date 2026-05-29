// app/dashboard/components/TopUpForm.tsx
"use client"
"use no memo"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type TopUpFormData = {
  household_id: string
  cycle_id: string
  created_by: string
  amount: number
  description: string
  transaction_date: string 
  payment_account: "cash" | "card"
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

interface TopUpFormProps {
  householdId: string
  currentCycleId: string
  createdBy: string
}

export default function TopUpForm({ householdId, currentCycleId, createdBy }: TopUpFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TopUpFormData>({
    defaultValues: {
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined,
      description: "",
      transaction_date: getTodayString(),
      payment_account: "cash", // Defaults to depositing into physical cash box
    }
  })

  // Synchronize form states the second page context resolves
  useEffect(() => {
    reset((prevValues) => ({
      ...prevValues,
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
    }))
  }, [householdId, currentCycleId, createdBy, reset])

  async function onSubmit(data: TopUpFormData) {
    if (!data.cycle_id || !data.household_id) {
      console.error("Submission Blocked: Missing active ledger identifiers.")
      return
    }

    const chosenDate = new Date(data.transaction_date)
    const now = new Date()
    
    if (data.transaction_date === getTodayString()) {
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      chosenDate.setHours(12, 0, 0)
    }

    // Map properties explicitly to your Top Up layout expectations
    const cleanPayload = {
      household_id: data.household_id,
      cycle_id: data.cycle_id,
      created_by: data.created_by,
      transaction_type: "top_up", // Hardcoded structural token
      amount: data.amount,
      description: data.description.trim(),
      created_at: chosenDate.toISOString(),
      payment_account: data.payment_account,
      
      // Forces explicit nulls for values not used during deposits
      category_id: null,
      counterparty_name: null,
      paid_by: null,
      notes: null,
    }

    const { error } = await supabase
      .from("transactions")
      .insert(cleanPayload)

    if (error) {
      console.error("Supabase Write Error:", error.message)
      return
    }

    reset({
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined,
      description: "",
      transaction_date: getTodayString(),
      payment_account: "cash",
    })
    
    setIsOpen(false)
    router.refresh()
  }

  return (
    <>
      {/* High-Conformity Green Addition Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
      >
        + Add Deposit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl relative">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Deposit (Top Up)</h2>
                <p className="text-xs text-gray-500">Injects funding liquidity directly into the active cycle.</p>
              </div>

              {/* Hidden System State Bindings */}
              <input type="hidden" {...register("household_id")} />
              <input type="hidden" {...register("cycle_id")} />
              <input type="hidden" {...register("created_by")} />

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Deposit Date *</label>
                <input
                  type="date"
                  {...register("transaction_date", { required: "Date is required" })}
                  suppressHydrationWarning
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount", { 
                    required: "Amount is required",
                    valueAsNumber: true,
                    validate: (val) => val > 0 || "Deposit must be greater than 0"
                  })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-base font-medium outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              {/* Destination Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Destination Account</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <label className={`flex-1 text-center py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all ${watch("payment_account") === "cash" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}>
                    <input type="radio" value="cash" {...register("payment_account")} className="sr-only" />
                    Cash Wallet
                  </label>
                  <label className={`flex-1 text-center py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all ${watch("payment_account") === "card" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}>
                    <input type="radio" value="card" {...register("payment_account")} className="sr-only" />
                    Bank Card
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Source / Description *</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly salary pool, cash injection"
                  {...register("description", { required: "Please describe the source of this funding" })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors text-sm shadow-sm"
                >
                  {isSubmitting ? "Processing..." : "Add Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}