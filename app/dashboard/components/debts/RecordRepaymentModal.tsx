// app/dashboard/debts/_components/RecordRepaymentModal.tsx
"use client"

import { useState, useId } from "react"
import { X, CreditCard, Banknote, Loader2 } from "lucide-react"
import { recordRepaymentAction } from "@/app/dashboard/_services/recordRepayment"
import type { ParsedDebtItem } from "@/app/dashboard/_db/debt"

interface RecordRepaymentModalProps {
  debt: ParsedDebtItem
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PERCENTAGE_PRESETS = [0, 25, 50, 75, 100] as const

export default function RecordRepaymentModal({
  debt,
  isOpen,
  onClose,
  onSuccess,
}: RecordRepaymentModalProps) {
  const isYouOwe = debt.direction === "you_owe"
  const maxRemaining = debt.remainingAmount
  const sliderId = useId()

  const [amount, setAmount] = useState<string>(maxRemaining.toString())
  const [paymentAccount, setPaymentAccount] = useState<"cash" | "card">("cash")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  // Calculate current slider percentage (0 to 100)
  const numericAmount = parseFloat(amount) || 0
  const currentPercentage = maxRemaining > 0 
    ? Math.min(100, Math.max(0, Math.round((numericAmount / maxRemaining) * 100))) 
    : 0

  // Quick Preset Selection (0%, 25%, 50%, 75%, 100%)
  const handlePresetSelect = (percentage: number) => {
    const computedVal = Math.round((maxRemaining * (percentage / 100)) * 100) / 100
    setAmount(computedVal.toString())
    setErrorMsg(null)
  }

  // Slider change handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value)
    const computedVal = Math.round((maxRemaining * (percent / 100)) * 100) / 100
    setAmount(computedVal.toString())
    setErrorMsg(null)
  }

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const numVal = parseFloat(amount)
    if (isNaN(numVal) || numVal <= 0) {
      setErrorMsg("Please enter an amount greater than 0.")
      return
    }
    if (numVal > maxRemaining + 0.009) {
      setErrorMsg(`Amount cannot exceed Rs ${maxRemaining.toLocaleString()}`)
      return
    }

    try {
      setLoading(true)
      await recordRepaymentAction({
        parentDebtId: debt.id,
        amount: numVal,
        paymentAccount,
        notes,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record payment.")
    } finally {
      setLoading(false)
    }
  }

  const themeColorClass = isYouOwe ? "text-[#e17055]" : "text-[#00b894]"
  const themeBgClass = isYouOwe ? "bg-[#e17055]" : "bg-[#00b894]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-[#2d3436]">
              {isYouOwe ? "Pay Repayment" : "Receive Repayment"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isYouOwe
                ? `Paying back to ${debt.counterparty}`
                : `Receiving funds from ${debt.counterparty}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs font-medium text-[#e17055]">
              {errorMsg}
            </div>
          )}

          {/* Amount Field + Full CTA */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-semibold text-gray-600">Amount (Rs)</label>
              <button
                type="button"
                onClick={() => handlePresetSelect(100)}
                className={`text-[11px] font-bold ${themeColorClass} hover:underline`}
              >
                Full (Rs {maxRemaining.toLocaleString()})
              </button>
            </div>
            
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                Rs
              </span>
              <input
                type="number"
                step="any"
                min="0"
                max={maxRemaining}
                value={amount}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-base font-bold text-[#2d3436] focus:outline-none focus:bg-white focus:border-gray-400 transition-all"
                required
              />
            </div>
          </div>

          {/* ── Interactive Range Slider & Percent Presets ── */}
          <div className="space-y-2.5 pt-1">
            <div className="relative flex items-center">
              <input
                id={sliderId}
                type="range"
                min="0"
                max="100"
                value={currentPercentage}
                onChange={handleSliderChange}
                aria-label="Repayment percentage"
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2d3436] focus:outline-none"
                style={{
                  background: `linear-gradient(to right, ${isYouOwe ? "#e17055" : "#00b894"} ${currentPercentage}%, #f1f3f5 ${currentPercentage}%)`,
                }}
              />
            </div>

            {/* Presets Row: 0%, 25%, 50%, 75%, 100% */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {PERCENTAGE_PRESETS.map((preset) => {
                const isActive = currentPercentage === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold tracking-tight transition-all ${
                      isActive
                        ? `${themeBgClass} text-white shadow-sm`
                        : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80"
                    }`}
                  >
                    {preset}%
                  </button>
                )
              })}
            </div>
          </div>

          {/* Payment Account Selection */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {isYouOwe ? "Paid From" : "Deposit Into"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentAccount("cash")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentAccount === "cash"
                    ? isYouOwe
                      ? "bg-rose-50 border-[#e17055] text-[#e17055]"
                      : "bg-[#00b894]/10 border-[#00b894] text-[#00b894]"
                    : "bg-white border-gray-200/80 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Banknote size={15} />
                Cash Vault
              </button>

              <button
                type="button"
                onClick={() => setPaymentAccount("card")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentAccount === "card"
                    ? isYouOwe
                      ? "bg-rose-50 border-[#e17055] text-[#e17055]"
                      : "bg-[#00b894]/10 border-[#00b894] text-[#00b894]"
                    : "bg-white border-gray-200/80 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CreditCard size={15} />
                Card Account
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid half via bank transfer"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-[#2d3436] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-400 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || numericAmount <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2d3436] hover:bg-black text-white text-xs font-semibold shadow-sm disabled:opacity-40 transition-all"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}