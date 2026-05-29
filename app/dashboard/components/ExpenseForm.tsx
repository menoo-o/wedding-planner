// app/dashboard/components/ExpenseForm.tsx
"use client"
"use no memo" // Silences the React Compiler watch warning safely

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type ExpenseFormData = {
  household_id: string
  cycle_id: string
  created_by: string
  amount: number
  category_id: string | null
  description: string
  notes: string | null
  transaction_date: string 
  paid_by: "household" | "other"
  payment_account: "cash" | "card" | "personal"
  counterparty_name: string | null
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

interface ExpenseFormProps {
  categories: { id: string; name: string }[]
  householdId: string
  currentCycleId: string
  createdBy: string
}

export default function ExpenseForm({ categories, householdId, currentCycleId, createdBy }: ExpenseFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined,
      category_id: null,
      description: "",
      notes: null,
      transaction_date: getTodayString(),
      paid_by: "household",        
      payment_account: "cash",
      counterparty_name: null,
    }
  })

  // 1. DYNAMIC DATA SYNC: Feeds the form fields as soon as server props load on page.tsx
  useEffect(() => {
    reset((prevValues) => ({
      ...prevValues,
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
    }))
  }, [householdId, currentCycleId, createdBy, reset])

  // Watch the payer selection to switch between layouts dynamically
  const watchedPaidBy = watch("paid_by")

  async function onSubmit(data: ExpenseFormData) {
    // Safety Fallback Guard
    if (!data.cycle_id || !data.household_id) {
      console.error("Submission Blocked: Missing reference context IDs.")
      return
    }

    const chosenDate = new Date(data.transaction_date)
    const now = new Date()
    
    if (data.transaction_date === getTodayString()) {
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      chosenDate.setHours(12, 0, 0)
    }

    // 2. BUILD COMPREHENSIVE PAYLOAD
    const cleanPayload = {
      household_id: data.household_id, // Dynamically assigned from props context
      cycle_id: data.cycle_id,
      created_by: data.created_by,     // Injected securely to prevent constraint crashes
      transaction_type: "expense", 
      amount: data.amount,
      category_id: data.category_id || null,
      description: data.description,
      notes: data.notes?.trim() || null,
      paid_by: data.paid_by,
      created_at: chosenDate.toISOString(),
      
      payment_account: data.paid_by === "other" ? "personal" : data.payment_account,
      counterparty_name: data.paid_by === "other" ? data.counterparty_name?.trim() : null,
    }

    const { error } = await supabase
      .from("transactions")
      .insert(cleanPayload)

    if (error) {
      console.error("Supabase Error:", error.message)
      return
    }

    // 3. CLEAN UP FORM STATE & CLOSE OVERLAY
    reset({
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined,
      category_id: null,
      description: "",
      notes: null,
      transaction_date: getTodayString(),
      paid_by: "household",
      payment_account: "cash",
      counterparty_name: null,
    })
    
    setIsOpen(false) // Closes the popup modal view automatically
    router.refresh()
  }

  return (
    <>
      {/* Visual CTA Button Link */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
      >
        Open Expense Form
      </button>

      {/* Modal View Interface */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Corner Close Trigger */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>

            {/* Cleaned Unified Form Wrapper */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record Expense</h2>
                <p className="text-xs text-gray-500">Adds an immediate debit to the active cycle log.</p>
              </div>

              {/* Hidden System Trackers */}
              <input type="hidden" {...register("household_id")} />
              <input type="hidden" {...register("cycle_id")} />
              <input type="hidden" {...register("created_by")} />

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction Date *</label>
                <input
                  type="date"
                  {...register("transaction_date", { required: "Date is required" })}
                  suppressHydrationWarning
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.transaction_date && <p className="text-red-500 text-xs mt-1">{errors.transaction_date.message}</p>}
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
                    validate: (val) => val > 0 || "Amount must be greater than 0"
                  })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-base font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select 
                  {...register("category_id")} 
                  className="w-full border border-gray-300 p-2 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g., Office groceries, internet bill"
                  {...register("description", { required: "Description is required" })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>

              {/* Payer Toggle Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Who Paid?</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <label className={`flex-1 text-center py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all ${watchedPaidBy === "household" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}>
                    <input type="radio" value="household" {...register("paid_by")} className="sr-only" />
                    House Fund
                  </label>
                  <label className={`flex-1 text-center py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all ${watchedPaidBy === "other" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}>
                    <input type="radio" value="other" {...register("paid_by")} className="sr-only" />
                    Someone Else
                  </label>
                </div>
              </div>

              {/* Conditional Sub-Interfaces */}
              {watchedPaidBy === "household" ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Payment Source</label>
                  <div className="flex gap-4">
                    <label className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
                      <input type="radio" value="cash" {...register("payment_account")} className="mr-1.5 accent-red-600" /> 
                      Cash Wallet
                    </label>
                    <label className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
                      <input type="radio" value="card" {...register("payment_account")} className="mr-1.5 accent-red-600" /> 
                      Bank Card
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Payers Name *</label>
                    <input
                      type="text"
                      placeholder="Who paid for this?"
                      {...register("counterparty_name", { 
                        validate: (val) => watchedPaidBy !== "other" || (val && val.trim() !== "") || "Please specify who paid for this expense"
                      })}
                      className="w-full border border-gray-300 p-2 rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {errors.counterparty_name && <p className="text-red-500 text-xs mt-1">{errors.counterparty_name.message}</p>}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (Optional)</label>
                <textarea 
                  {...register("notes")} 
                  className="w-full border border-gray-300 p-2 rounded-lg h-16 text-sm resize-none outline-none focus:ring-2 focus:ring-red-500" 
                  placeholder="Add context, store info..." 
                />
              </div>

              {/* Submit Control Action */}
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
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors text-sm shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}