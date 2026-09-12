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

     
    </div>
  )
}