// app/dashboard/components/liquidity-widget/TransferModal.tsx
"use client"
"use no memo"

import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"

// ... existing code ...
type TransferFormData = {
  amount: number
  source_wallet: "cash" | "card"
  description: string
}

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  householdId: string
  currentCycleId: string
  createdBy?: string
  cashBalance: number
  cardBalance: number
}

export default function TransferModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  householdId, 
  currentCycleId, 
  createdBy, 
  cashBalance, 
  cardBalance 
}: TransferModalProps) {
  const supabase = createClient()
  const [writeError, setWriteError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    mode: "onChange",
    defaultValues: {
      amount: undefined,
      source_wallet: "cash",
      description: "",
    }
  })

  const fromWallet = watch("source_wallet")
  const toWallet = fromWallet === "cash" ? "card" : "cash"

  const availableCeiling = fromWallet === "cash" ? cashBalance : cardBalance

  if (!isOpen) return null

  async function onSubmit(data: TransferFormData) {
    setWriteError(null)
    
    if (!householdId || !currentCycleId || !createdBy) {
      setWriteError("Missing structural ledger references. Please reload.")
      return
    }

    const nowStr = new Date().toISOString()
    const customReason = data.description.trim() || "Internal vault fund allocation"

    const batchPayload = [
      {
        household_id: householdId,
        cycle_id: currentCycleId,
        created_by: createdBy,
        transaction_type: "transfer",       
        payment_account: data.source_wallet, // <-- Directly insert 'card' or 'cash'
        amount: data.amount,
        description: `Transfer out to ${toWallet.toUpperCase()}`,
        notes: customReason,
        created_at: nowStr,
        paid_by: "household",
        category_id: null,
      },
      {
        household_id: householdId,
        cycle_id: currentCycleId,
        created_by: createdBy,
        transaction_type: "transfer",       
        payment_account: toWallet,          // <-- Directly insert 'card' or 'cash'
        amount: data.amount,
        description: `Transfer in from ${data.source_wallet.toUpperCase()}`,
        notes: customReason,
        created_at: nowStr,
        paid_by: "household",
        category_id: null,
      }
    ]

    const { error } = await supabase
      .from("transactions")
      .insert(batchPayload)

    if (error) {
      setWriteError(error.message)
      return
    }

    reset()
    onClose()
    onSuccess()
  }
 
 return (    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl p-5 relative border border-gray-100">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm">✕</button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Move Vault Funds</h3>
            <p className="text-xs text-gray-500">Shifts liquidity balances internally between wallets.</p>
          </div>

          {writeError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium border border-red-100">
              Database Error: {writeError}
            </div>
          )}

          {/* Amount Box with dynamic error highlights */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-600">Amount to Transfer *</label>
              <span className="text-[11px] font-medium text-gray-400">
                Max: Rs. {availableCeiling}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { 
                required: "Please enter a valid transfer amount", 
                valueAsNumber: true, 
                validate: {
                  positive: (v) => v > 0 || "Amount must be greater than zero",
                  // 🏆 LIVE BALANCE OVERDRAFT CHECK RULE
                  insufficient: (v) => v <= availableCeiling || `Error: No funds! You only have Rs. ${availableCeiling} available.`
                }
              })}
              // Dynamic Tailwind styling classes flip to strict red if an validation error hits
              className={`w-full border p-2 rounded-lg text-base font-medium outline-none transition-all focus:ring-2 ${
                errors.amount 
                  ? "border-red-500 bg-red-50 text-red-900 focus:ring-red-200" 
                  : "border-gray-300 bg-white text-gray-900 focus:ring-gray-900"
              }`}
            />
            {errors.amount && (
              <p className="text-red-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                ⚠️ {errors.amount.message}
              </p>
            )}
          </div>

          {/* Direction Flow Visualizer */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Direction Flow</label>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-800">
              <span className="uppercase text-red-600">{fromWallet} (Source)</span>
              <span className="text-gray-400 font-normal">➔ ➔ ➔</span>
              <span className="uppercase text-green-600">{toWallet} (Target)</span>
            </div>
            
            <div className="flex gap-4 mt-2 px-1">
              <label className="text-xs flex items-center cursor-pointer text-gray-500 font-medium select-none">
                <input type="radio" value="cash" {...register("source_wallet")} className="mr-1.5 accent-gray-900" /> Cash to Card
              </label>
              <label className="text-xs flex items-center cursor-pointer text-gray-500 font-medium select-none">
                <input type="radio" value="card" {...register("source_wallet")} className="mr-1.5 accent-gray-900" /> Card to Cash
              </label>
            </div>
          </div>

          {/* Notes description text field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Memo / Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Bank deposit, cash checkout"
              {...register("description")}
              className="w-full border border-gray-300 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Form Trigger Actions */}
          <div className="flex gap-2 pt-1">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !!errors.amount} // 🛑 HARD BLOCK: Submit is locked if live error exists!
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-xs font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}