// app/transactions/new/TransactionForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type TransactionFormData = {
  household_id?: string
  cycle_id?: string
  created_by?: string
  transaction_type: string
  category_id?: string | null
  counterparty_name?: string | null
  amount: number
  description?: string
  reimbursement_status?: string | null
  cleared_at?: string
  notes?: string | null
  payment_account: "cash" | "card" | "personal"
  related_transaction_id?: string
  paid_by: "household" | "other"
}

export default function TransactionForm({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: {
      transaction_type: "",
      amount: undefined,
      description: "",
      category_id: null,
      notes: null,
      household_id: "",
      created_by: "",
      cycle_id: "",
      paid_by: "household",       // System default unless changed
      payment_account: "cash",    // System default unless changed
    }
  })

  async function onSubmit(formData: TransactionFormData) {
    // Sanitize values for the database
    const cleanData = {
      ...formData,
      category_id: formData.category_id || null,
      notes: formData.notes?.trim() || null,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("transactions")
      .insert(cleanData)

    if (error) {
      console.error("Insert failed:", error.message)
      return
    }

    reset()
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 max-w-md p-4 border rounded-xl shadow-sm bg-white"
    >
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

      {/* Transaction Type */}
      <div>
        <select
          {...register("transaction_type", { required: "Type is required" })}
          className="w-full border p-2 rounded bg-white"
        >
          <option value="">Select Transaction Type *</option>
          <option value="expense">Expense</option>
          <option value="top_up">Top Up</option>
          <option value="loan_out">Loan Out</option>
          <option value="loan_in">Loan In</option>
          <option value="loan_return">Loan Return</option>
          <option value="settlement">Settlement</option>
          <option value="refund">Refund</option>
          <option value="adjustment">Adjustment</option>
        </select>
        {errors.transaction_type && (
          <span className="text-red-500 text-xs">{errors.transaction_type.message}</span>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <select
          {...register("category_id")}
          className="w-full border p-2 rounded bg-white"
        >
          <option value="">Category (optional)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Manual IDs */}
      <div>
        <input
          placeholder="Household ID"
          {...register("household_id")}
          className="w-full border p-2 rounded mb-3"
        />
         <input
          placeholder="Created By"
          {...register("created_by")}
          className="w-full border p-2 rounded mb-3"
        />
        <input
          placeholder="Cycle ID"
          {...register("cycle_id")}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Paid By Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Paid By</label>
        <select
          {...register("paid_by")}
          className="w-full border p-2 rounded bg-white"
        >
          <option value="household">Household (Default)</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Payment Account Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Payment Account</label>
        <select
          {...register("payment_account")}
          className="w-full border p-2 rounded bg-white"
        >
          <option value="cash">Cash (Default)</option>
          <option value="card">Card</option>
          <option value="personal">Personal</option>
        </select>
      </div>

      {/* Amount Input */}
      <div>
        <input
          placeholder="Amount *"
          type="number"
          step="0.01"
          {...register("amount", { 
            required: "Amount is required",
            valueAsNumber: true,
            validate: (val) => val > 0 || "Amount must be greater than 0"
          })}
          className="w-full border p-2 rounded"
        />
        {errors.amount && (
          <span className="text-red-500 text-xs">{errors.amount.message}</span>
        )}
      </div>

      {/* Description */}
      <div>
        <input
          placeholder="Description"
          {...register("description")}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Notes */}
      <div>
        <textarea
          placeholder="Notes"
          {...register("notes")}
          className="w-full border p-2 rounded h-20 resize-none"
        />
      </div>

      {/* Actions */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors"
      >
        Save Transaction
      </button>
    </form>
  )
}