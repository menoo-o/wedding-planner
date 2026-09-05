// app/dashboard/debts/_components/DebtRowItem.tsx
"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, Layers, Receipt } from "lucide-react"
import type { UnifiedDebtRecord } from "@/app/dashboard/_db/debt"
import RepaymentHistoryTable from "./RepaymentHistoryTable"

interface DebtRowItemProps {
  debt: UnifiedDebtRecord
}

export default function DebtRowItem({ debt }: DebtRowItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isReceivable = debt.direction === "receivable"

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer hover:bg-gray-50/60 transition-colors"
      >
        {/* Counterparty / Details */}
        <div className="col-span-12 md:col-span-4 flex items-center gap-3.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isReceivable ? "bg-emerald-50 text-[#00b894]" : "bg-rose-50 text-[#e17055]"
            }`}
          >
            {isReceivable ? (
              <ArrowUpRight size={17} strokeWidth={2} />
            ) : (
              <ArrowDownLeft size={17} strokeWidth={2} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2d3436] truncate">
              {debt.counterparty_name}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{debt.description}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Created on{" "}
              {new Date(debt.created_at).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Type */}
        <div className="col-span-4 md:col-span-2 flex items-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-[#00b894]">
            {debt.obligation_type === "loan" ? (
              <Layers size={13} strokeWidth={2} />
            ) : (
              <Receipt size={13} strokeWidth={2} />
            )}
            <span className="capitalize">{debt.obligation_type}</span>
          </span>
        </div>

        {/* Status */}
        <div className="col-span-4 md:col-span-1 flex items-center">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
              debt.status === "settled"
                ? "bg-emerald-50 text-[#00b894]"
                : debt.status === "partial"
                ? "bg-amber-50 text-amber-600"
                : "bg-rose-50 text-[#e17055]"
            }`}
          >
            {debt.status}
          </span>
        </div>

        {/* Progress / Remaining */}
        <div className="col-span-8 md:col-span-3">
          <div className="space-y-1.5 pr-4">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  debt.status === "settled" ? "bg-[#00b894]" : "bg-gray-400"
                }`}
                style={{ width: `${debt.progress_percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400">
              <span className="font-semibold text-gray-700">
                Rs {debt.remaining_amount.toLocaleString()}
              </span>{" "}
              remaining ({debt.progress_percentage}%)
            </p>
          </div>
        </div>

        {/* Total Amount & Caret */}
        <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-3">
          <span className="text-sm font-bold text-[#2d3436]">
            Rs {debt.original_amount.toLocaleString()}
          </span>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            aria-label="Toggle history"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <RepaymentHistoryTable
          installments={debt.installments}
          originalAmount={debt.original_amount}
          totalPaid={debt.total_paid}
          remainingAmount={debt.remaining_amount}
        />
      )}
    </div>
  )
}