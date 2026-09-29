// app/dashboard/debts/_components/DebtsHeader.tsx
"use client"

// import { Plus } from "lucide-react"

export default function DebtsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#2d3436]">
          Debts & Obligations
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Loans & reimbursements
        </p>
      </div>
    </div>
  )
}