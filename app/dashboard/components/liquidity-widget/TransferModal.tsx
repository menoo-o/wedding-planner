"use client"
"use no memo"

import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"

type TransferFormData = {
  amount: number
  source_wallet: "cash" | "card"
  description: string
  // 💡 Added tracks for Savings Lockbox routing
  is_savings_transfer: boolean
  savings_direction: "in" | "out"
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
  // 💼 Added Props to bind your custom wallet context dynamically
  walletName: string | null
  savingsBalance: number
}

export default function TransferModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  householdId, 
  currentCycleId, 
  createdBy, 
  cashBalance, 
  cardBalance,
  walletName,
  savingsBalance
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
      is_savings_transfer: false,
      savings_direction: "in",
    }
  })

  // Watch control states to dynamically render bounds
  const fromWallet = watch("source_wallet")
  const isSavingsTransfer = watch("is_savings_transfer")
  const savingsDirection = watch("savings_direction")

  // 1. Core Target Definition Switch
  const toWallet = fromWallet === "cash" ? "card" : "cash"
  const activeWalletName = walletName || "Savings Wallet"

  // 2. Dynamic Live Balance Overdraft Ceiling Check Rule
  let availableCeiling = fromWallet === "cash" ? cashBalance : cardBalance
  if (isSavingsTransfer && savingsDirection === "out") {
    availableCeiling = savingsBalance
  }

  if (!isOpen) return null

  async function onSubmit(data: TransferFormData) {
    setWriteError(null)
    
    if (!householdId || !currentCycleId || !createdBy) {
      setWriteError("Missing structural ledger references. Please reload.")
      return
    }

    const nowStr = new Date().toISOString()
    const customReason = data.description.trim() || "Internal vault fund allocation"
    let batchPayload: any[] = []

    if (data.is_savings_transfer) {
      // Fetch fresh balances to check concurrent state
      const { data: currentHousehold, error: fetchError } = await supabase
        .from("households")
        .select("savings_balance")
        .eq("id", householdId)
        .single()

      if (fetchError || !currentHousehold) {
        setWriteError("Could not verify household vault setup configuration.")
        return
      }

      const currentSavingsPool = Number(currentHousehold.savings_balance || 0)
      let targetSavingsBalance = currentSavingsPool

      if (data.savings_direction === "in") {
        // Cash/Card ➡️ Savings Vault
        targetSavingsBalance += data.amount
        batchPayload = [
          {
            household_id: householdId,
            cycle_id: currentCycleId,
            created_by: createdBy,
            transaction_type: "transfer",       
            payment_account: data.source_wallet,
            amount: data.amount,
            description: `Transfer out to ${activeWalletName.toUpperCase()}`,
            notes: customReason,
            created_at: nowStr,
            paid_by: "household",
            category_id: null,
          }
        ]
      } else {
        // Savings Vault ➡️ Cash/Card
        if (currentSavingsPool < data.amount) {
          setWriteError(`Insufficient vault balance! Available: Rs. ${currentSavingsPool}`)
          return
        }
        targetSavingsBalance -= data.amount
        batchPayload = [
          {
            household_id: householdId,
            cycle_id: currentCycleId,
            created_by: createdBy,
            transaction_type: "transfer",       
            payment_account: data.source_wallet, // Received back into cash or card account
            amount: data.amount,
            description: `Transfer in from ${activeWalletName.toUpperCase()}`,
            notes: customReason,
            created_at: nowStr,
            paid_by: "household",
            category_id: null,
          }
        ]
      }

      // Step A: Update dynamic vault balance pool
      const { error: householdUpdateError } = await supabase
        .from("households")
        .update({ savings_balance: targetSavingsBalance })
        .eq("id", householdId)

      if (householdUpdateError) {
        setWriteError(`Failed to process vault update: ${householdUpdateError.message}`)
        return
      }

    } else {
      // Legacy Standard Transfer Flow (Cash ➡️ Card or vice versa)
      batchPayload = [
        {
          household_id: householdId,
          cycle_id: currentCycleId,
          created_by: createdBy,
          transaction_type: "transfer",       
          payment_account: data.source_wallet,
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
          payment_account: toWallet,
          amount: data.amount,
          description: `Transfer in from ${data.source_wallet.toUpperCase()}`,
          notes: customReason,
          created_at: nowStr,
          paid_by: "household",
          category_id: null,
        }
      ]
    }

    // Step B: Write matching ledger batch
    const { error: txError } = await supabase
      .from("transactions")
      .insert(batchPayload)

    if (txError) {
      setWriteError(txError.message)
      return
    }

    reset()
    onClose()
    onSuccess()
  }
 
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl p-5 relative border border-gray-100">
        
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm">✕</button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Move Vault Funds</h3>
            <p className="text-xs text-gray-500">Shifts liquidity balances internally across household layers.</p>
          </div>

          {writeError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg font-medium border border-red-100">
              Database Error: {writeError}
            </div>
          )}

          {/* Optional Vault Mode Switch Controller: Only appears if custom wallet configured */}
          {walletName && (
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 block">Target Locked Vault</label>
                <p className="text-[10px] text-slate-500">Route interactions to {walletName}</p>
              </div>
              <input
                type="checkbox"
                {...register("is_savings_transfer")}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>
          )}

          {/* Amount Box with dynamic error highlights */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-600">Amount to Transfer *</label>
              <span className="text-[11px] font-medium text-gray-400">
                Max: Rs. {availableCeiling.toLocaleString()}
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
                  insufficient: (v) => v <= availableCeiling || `Error: No funds! You only have Rs. ${availableCeiling} available.`
                }
              })}
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

          {/* Direction Flow Visualizer Panel */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Direction Flow</label>
            
            {isSavingsTransfer ? (
              /* Savings Router Display Engine */
              <div className="space-y-3 p-2.5 border border-emerald-100 bg-emerald-50/20 rounded-xl">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  {savingsDirection === "in" ? (
                    <>
                      <span className="uppercase text-red-600">{fromWallet}</span>
                      <span className="text-gray-400 font-normal">➔ ➔ ➔</span>
                      <span className="uppercase text-emerald-600">{activeWalletName}</span>
                    </>
                  ) : (
                    <>
                      <span className="uppercase text-emerald-600">{activeWalletName}</span>
                      <span className="text-gray-400 font-normal">➔ ➔ ➔</span>
                      <span className="uppercase text-green-600">{fromWallet}</span>
                    </>
                  )}
                </div>

                <div className="flex gap-4 border-t border-emerald-100/60 pt-2 justify-center">
                  <label className="text-[11px] flex items-center cursor-pointer text-slate-700 font-bold select-none">
                    <input type="radio" value="in" {...register("savings_direction")} className="mr-1 accent-emerald-600" /> Stash Money In
                  </label>
                  <label className="text-[11px] flex items-center cursor-pointer text-slate-700 font-bold select-none">
                    <input type="radio" value="out" {...register("savings_direction")} className="mr-1 accent-emerald-600" /> Pull Money Out
                  </label>
                </div>
              </div>
            ) : (
              /* Legacy Standard Transfer Flow Display Engine */
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-800">
                <span className="uppercase text-red-600">{fromWallet} (Source)</span>
                <span className="text-gray-400 font-normal">➔ ➔ ➔</span>
                <span className="uppercase text-green-600">{toWallet} (Target)</span>
              </div>
            )}
            
            {/* Base Spending Account Origin Selectors */}
            <div className="flex gap-4 mt-2 px-1 justify-center">
              <label className="text-xs flex items-center cursor-pointer text-gray-500 font-medium select-none">
                <input type="radio" value="cash" {...register("source_wallet")} className="mr-1.5 accent-gray-900" /> {isSavingsTransfer ? "Interact with Cash" : "Cash to Card"}
              </label>
              <label className="text-xs flex items-center cursor-pointer text-gray-500 font-medium select-none">
                <input type="radio" value="card" {...register("source_wallet")} className="mr-1.5 accent-gray-900" /> {isSavingsTransfer ? "Interact with Card" : "Card to Cash"}
              </label>
            </div>
          </div>

          {/* Notes description text field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Memo / Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Savings allocation, emergency backup"
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
              disabled={isSubmitting || !!errors.amount}
              className={`flex-1 text-white py-2 rounded-lg text-xs font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${
                isSavingsTransfer ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {isSubmitting ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}