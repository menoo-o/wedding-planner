// app/dashboard/components/liquidity-widget/index.tsx
"use client"
"use no memo"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import LiquidityDisplay from "./LiquidityDisplay"
import TransferModal from "./TransferModal"

interface LiquidityWidgetProps {
  householdId: string
  currentCycleId: string
  createdBy?: string
  cash: number
  card: number
  total: number
}

export default function LiquidityWidget({ householdId, currentCycleId, createdBy, cash, card, total }: LiquidityWidgetProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition() // Handles the smooth loader state

  // Triggers a fresh server data update across the layout seamlessly
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Liquidity Overview</h2>
          <p className="text-xs text-gray-500">Real-time internal account distributions.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Button utilizing Next.js Server Re-validation */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh Ledger"
          >
            <svg 
              className={`w-4 h-4 ${isPending ? "animate-spin text-blue-600" : ""}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            ⇄ Transfer
          </button>
        </div>
      </div>

      {/* Render the stats sent straight from your server query */}
      <LiquidityDisplay cash={cash} card={card} total={total} />

      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh} // Refresh server-side states on successful write
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
        cashBalance={cash} // <-- Pass live server-supplied balance
        cardBalance={card} // <-- Pass live server-supplied balance
      />
    </div>
  )
}