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

  // Calculate percentage paid / received
  const percentagePaid =
    debt.totalAmount > 0
      ? Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100))
      : 0

  // ── Variant 1: Settled Row ──
  if (isSettled) {
    return (
      <div className="border-b border-gray-50/80 last:border-b-0">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center justify-between p-3.5 sm:px-6 sm:py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        >
          {/* Avatar + Counterparty info */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-3">
            <div
              className={`w-8 h-8 rounded-xl sm:rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isYouOwe ? "bg-rose-50 text-[#e17055]" : "bg-emerald-50 text-[#00b894]"
              }`}
            >
              {debt.initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[#2d3436] truncate">
                {isYouOwe ? `Paid to ${debt.counterparty}` : `Received from ${debt.counterparty}`}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">
                {debt.description}
              </p>
            </div>
          </div>

          {/* Settled Badge + Amount + Chevron */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold tracking-wider bg-emerald-50 text-[#00b894] uppercase">
              Settled
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#2d3436] tabular-nums">
              Rs {debt.totalAmount.toLocaleString()}
            </span>
            <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>
        </div>

        {isOpen && (
          <RepaymentHistoryTable
          debt={debt}
          installments={debt.installments}
          originalAmount={debt.totalAmount}
          totalPaid={debt.paidAmount}
          remainingAmount={debt.remainingAmount}
        />
        )}
      </div>
    )
  }

  // ── Variant 2: Needs Attention (Active) Row ──
  return (
    <div className="border-b border-gray-50 last:border-b-0">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-3.5 sm:px-6 sm:py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
      >
        {/* Main Content Area (Mobile: Stacked cleanly, Desktop: Multi-column grid) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Top Row on Mobile: Avatar + Phrasing & Amount */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 sm:gap-3.5 min-w-0 md:w-5/12">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isYouOwe ? "bg-rose-50 text-[#e17055]" : "bg-emerald-50 text-[#00b894]"
                }`}
              >
                {debt.initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#2d3436] truncate">
                  {isYouOwe ? `You owe ${debt.counterparty}` : `${debt.counterparty} owes you`}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">
                  {debt.description}
                </p>
              </div>
            </div>

            {/* Amount visible on mobile in top-right */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              <span
                className={`text-xs sm:text-sm font-bold tabular-nums ${
                  isYouOwe ? "text-[#e17055]" : "text-[#2d3436]"
                }`}
              >
                Rs {debt.remainingAmount.toLocaleString()}
              </span>
              <div className="text-gray-300">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
          </div>

          {/* Progress Bar & Repayment Metric */}
          <div className="w-full md:w-4/12 pl-10.5 sm:pl-0 md:px-4">
            <div className="w-full bg-gray-100 h-1 sm:h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isYouOwe ? "bg-[#e17055]" : "bg-[#00b894]"
                }`}
                style={{ width: `${Math.max(percentagePaid > 0 ? 5 : 0, percentagePaid)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-400 mt-1 font-medium">
              <span>
                {percentagePaid}% {isYouOwe ? "paid" : "received"}
                {debt.paidAmount > 0 && (
                  <span className="hidden sm:inline text-gray-500 ml-1">
                    (Rs {debt.paidAmount.toLocaleString()} of {debt.totalAmount.toLocaleString()})
                  </span>
                )}
              </span>

              {/* Mobile-only directional badge next to progress metric */}
              <span
                className={`md:hidden px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  isYouOwe ? "bg-rose-50 text-[#e17055]" : "bg-emerald-50 text-[#00b894]"
                }`}
              >
                {isYouOwe ? "You Owe" : "Owed to You"}
              </span>
            </div>
          </div>

          {/* Desktop Right Side: Tag + Remaining Amount + Caret */}
          <div className="hidden md:flex items-center justify-end gap-3 md:gap-4 md:w-3/12 shrink-0">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                isYouOwe ? "bg-rose-50 text-[#e17055]" : "bg-emerald-50 text-[#00b894]"
              }`}
            >
              {isYouOwe ? "You Owe" : "Owed to You"}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold tabular-nums ${
                  isYouOwe ? "text-[#e17055]" : "text-[#2d3436]"
                }`}
              >
                Rs {debt.remainingAmount.toLocaleString()}
              </span>
              <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>
            </div>
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