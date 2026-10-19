// app/dashboard/expenses/_components/EditExpenseModal.tsx
"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import type { ExpenseTransaction } from "../_lib/utils" //[cite: 16]
import { updateExpenseAction } from "../actions"

interface EditModalProps {
  isOpen: boolean
  tx: ExpenseTransaction //[cite: 16]
  categories: { id: string; name: string }[] //[cite: 16]
  onClose: () => void
}

export default function EditExpenseModal({
  isOpen,
  tx,
  categories,
  onClose,
}: EditModalProps) {
  const [description, setDescription] = useState(tx.description || "") //[cite: 16]
  const [amount, setAmount] = useState(String(tx.amount)) //[cite: 16]
  const [categoryId, setCategoryId] = useState(tx.category_id || categories[0]?.id || "") //[cite: 16]
  const [paymentAccount, setPaymentAccount] = useState<"cash" | "card">(
    (tx.payment_account as "cash" | "card") || "card" //[cite: 16]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await updateExpenseAction({
        transactionId: tx.id, //[cite: 16]
        description,
        amount: parseFloat(amount),
        categoryId,
        paymentAccount,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl border border-gray-100 shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <h2 className="text-base font-bold text-[#2d3436]">Edit Expense</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-600 font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Amount (Rs)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden capitalize"
            >
              {categories.map((c) => ( //[cite: 16]
                <option key={c.id} value={c.id}>
                  {c.name} {/*[cite: 16] */}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Account */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Account
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["card", "cash"] as const).map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setPaymentAccount(acc)}
                  className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                    paymentAccount === acc
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}