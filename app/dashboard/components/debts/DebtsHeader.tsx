// app/dashboard/debts/_components/DebtsHeader.tsx
"use client"

import { Plus } from "lucide-react"

export default function DebtsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#2d3436]">Debts & Obligations</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track loans and reimbursements with people you trust.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2d3436] text-white text-sm font-medium hover:bg-black transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2} />
          New Debt
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200/80 text-[#2d3436] text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2} />
          Record Repayment
        </button>
      </div>
    </div>
  )
}