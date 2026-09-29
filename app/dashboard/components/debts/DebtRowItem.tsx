// app/dashboard/debts/_components/DebtRowItem.tsx
"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { ParsedDebtItem } from "@/app/dashboard/_db/debt"
import RepaymentHistoryTable from "./RepaymentHistoryTable"

interface DebtRowItemProps {
  debt: ParsedDebtItem
  variant?: "attention" | "settled"
}

export default function DebtRowItem({ debt, variant }: DebtRowItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isSettled = variant === "settled" || debt.isSettled
  const isYouOwe = debt.direction === "you_owe"

  // ── Variant 1: Settled Row Item ───────────────────────────────
  if (isSettled) {
    return (
      <div className="border-b border-gray-50/80 last:border-b-0">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center justify-between px-4 sm:px-6 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        >
          {/* Avatar + Subtitle */}
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isYouOwe ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {debt.initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[#2d3436] truncate">
                {debt.counterparty}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {debt.description}
                {debt.createdAtFormatted && <span> · {debt.createdAtFormatted}</span>}
              </p>
            </div>
          </div>

          {/* Settled Badge + Amount + Caret */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-600 uppercase">
              Settled
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#2d3436] tabular-nums">
              Rs {debt.totalAmount.toLocaleString()}
            </span>
            <button
              type="button"
              className="text-gray-300 group-hover:text-gray-500 transition-colors"
              aria-label="Toggle details"
            >
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <RepaymentHistoryTable
            installments={debt.installments}
            originalAmount={debt.totalAmount}
            totalPaid={debt.paidAmount}
            remainingAmount={debt.remainingAmount}
          />
        )}
      </div>
    )
  }

  // ── Variant 2: Needs Attention Row Item ───────────────────────
  return (
    <div className="border-b border-gray-50 last:border-b-0">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
      >
        {/* Left: Counterparty Avatar + Title / Due Date */}
        <div className="flex items-center gap-3.5 min-w-0 md:w-5/12">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isYouOwe ? "bg-rose-100/70 text-rose-500" : "bg-emerald-100/70 text-emerald-600"
            }`}
          >
            {debt.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2d3436] truncate">
              {debt.counterparty}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {debt.description}
            </p>
            {debt.dueBadgeText && (
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                {debt.dueBadgeText}
              </p>
            )}
          </div>
        </div>

        {/* Center: Dynamic Progress Bar & Remaining Percentage */}
        <div className="w-full md:w-4/12 md:px-4">
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isYouOwe ? "bg-[#e17055]" : "bg-[#00b894]"
              }`}
              style={{ width: `${Math.max(5, debt.remainingPercentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {debt.remainingPercentage}% remaining
          </p>
        </div>

        {/* Right: Directional Badge + Amount + Toggle Arrow */}
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 md:w-3/12 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
              isYouOwe
                ? "bg-rose-50 text-rose-500"
                : "bg-teal-50 text-[#00a884]"
            }`}
          >
            {isYouOwe ? "You Owe" : "You're Owed"}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#2d3436] tabular-nums">
              Rs {debt.remainingAmount.toLocaleString()}
            </span>
            <button
              type="button"
              className="text-gray-300 group-hover:text-gray-500 transition-colors"
              aria-label="Toggle details"
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <RepaymentHistoryTable
          installments={debt.installments}
          originalAmount={debt.totalAmount}
          totalPaid={debt.paidAmount}
          remainingAmount={debt.remainingAmount}
        />
      )}
    </div>
  )
}