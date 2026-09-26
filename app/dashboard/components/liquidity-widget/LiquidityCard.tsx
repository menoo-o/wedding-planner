"use client"

// app/dashboard/components/LiquidityCard.tsx
//
// Drop-in replacement for the inline "Liquidity" stat card. Same markup as
// before (so it still sits flush with Obligations / Net Debt / etc. on
// dashboard, expenses, debts pages) plus a transfer trigger and the modal,
// so each page only needs to pass its own balances — no separate
// <TransferModal> wiring required per page.
//
// Usage:
//   <LiquidityCard
//     cash={cash} card={card} total={total}
//     walletName={walletName} savingsBalance={savingsBalance}
//     householdId={householdId} currentCycleId={currentCycleId} createdBy={createdBy}
//     showToast={showToast}
//   />

import { useState } from "react"
import { Wallet, ArrowLeftRight } from "lucide-react"
import { useRouter } from "next/navigation"
import TransferModal from "./TransferModal"
import Toast, { useToast } from "../Toast"

interface LiquidityCardProps {
  cash: number
  card: number
  total: number
  walletName?: string | null
  savingsBalance?: number
  householdId?: string | null
  currentCycleId: string | null
  createdBy?: string
  showToast?: (type: "success" | "error" | "info", title: string, message: string) => void
  /** Called after a successful transfer, in addition to router.refresh(). */
  onTransferSuccess?: () => void
  className?: string
}

export default function LiquidityCard({
  cash,
  card,
  total,
  walletName = null,
  savingsBalance = 0,
  householdId,
  currentCycleId,
//   createdBy,
//   showToast,
  onTransferSuccess,
  className = "",
}: LiquidityCardProps) {
  const [transferOpen, setTransferOpen] = useState(false)
  const router = useRouter()
  

  return (
    <>
      <div
        className={`relative bg-white rounded-2xl p-4 sm:p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Wallet size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
              Liquidity
            </span>
          </div>

          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            aria-label="Transfer funds"
            title="Transfer funds"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#8b9dc3]/10 hover:text-[#8b9dc3]"
          >
            <ArrowLeftRight size={14} strokeWidth={1.8} />
          </button>
        </div>

        <p className="text-xl sm:text-2xl font-bold text-[#2d3436]">Rs {total.toLocaleString()}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
          <span>Cash: Rs {cash.toLocaleString()}</span>
          <span className="hidden sm:inline">·</span>
          <span>Card: Rs {card.toLocaleString()}</span>
        </div>
      </div>

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSuccess={() => {
          onTransferSuccess?.()
          router.refresh()
        }}
        householdId={householdId}
        currentCycleId={currentCycleId}
        // createdBy={createdBy}
        cashBalance={cash}
        cardBalance={card}
        walletName={walletName}
        savingsBalance={savingsBalance}
      />
    </>
  )
}