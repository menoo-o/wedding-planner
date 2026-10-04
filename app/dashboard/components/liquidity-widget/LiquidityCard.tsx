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
// import Toast, { useToast } from "../Toast"

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
  
//liquidity card
  return (
    <>
    <div
      className={`relative rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Wallet size={14} strokeWidth={1.5} className="shrink-0" />
          <span className="text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-gray-500">
            Liquidity
          </span>
        </div>

        <button
          type="button"
          onClick={() => setTransferOpen(true)}
          aria-label="Transfer funds"
          title="Transfer funds"
          className="-my-1.5 -mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#8b9dc3]/10 hover:text-[#6f84b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b9dc3]/50"
        >
          <ArrowLeftRight size={14} strokeWidth={1.8} />
        </button>
      </div>

      <p className="text-xl font-semibold tracking-tight tabular-nums text-[#2d3436] sm:text-2xl">
        Rs {total.toLocaleString()}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500">
        <span>Cash: Rs {cash.toLocaleString()}</span>
        <span aria-hidden className="hidden sm:inline">·</span>
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
        householdId={householdId ?? null}
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