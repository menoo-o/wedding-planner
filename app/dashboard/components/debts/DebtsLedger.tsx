// app/dashboard/debts/_components/DebtsLedger.tsx
"use client"

import type { UnifiedDebtRecord } from "@/app/dashboard/_db/debt"
import DebtRowItem from "./DebtRowItem"

interface DebtsLedgerProps {
  debts: UnifiedDebtRecord[]
}

export default function DebtsLedger({ debts }: DebtsLedgerProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Table Column Headers */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400">
        <div className="col-span-4">Counterparty / Details</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-3">Progress / Remaining</div>
        <div className="col-span-2 text-right">Amount</div>
      </div>

      {/* Rows */}
      {debts.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-xs">
          No matching obligations found.
        </div>
      ) : (
        debts.map((debt) => <DebtRowItem key={debt.id} debt={debt} />)
      )}
    </div>
  )
}