// app/dashboard/savings/emergency-spend/_components/EmergencySpendLedger.tsx
"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, Lightbulb } from "lucide-react"
import type { EmergencySpendRow } from "@/app/dashboard/_db/emergencySpend"
import EmergencySpendRowItem from "./EmergencySpendRowItem"

interface LedgerProps {
  expenses: EmergencySpendRow[]
  selectedYear: number
}

export default function EmergencySpendLedger({ expenses, selectedYear }: LedgerProps) {
  const [isYearExpanded, setIsYearExpanded] = useState(true)

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-7 space-y-4">
      {/* ── Ledger Header ── */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#2d3436]">Main List</h2>
          <p className="text-[11px] text-gray-400">Grouped by year instead of by day</p>
        </div>
        <span className="text-xs font-semibold text-gray-400">{selectedYear}</span>
      </div>

      {/* ── Year Accordion Trigger ── */}
      <div
        onClick={() => setIsYearExpanded((prev) => !prev)}
        className="flex items-center justify-between cursor-pointer select-none py-1 group"
      >
        <div className="flex items-center gap-2">
          {isYearExpanded ? (
            <ChevronUp size={15} className="text-gray-400 group-hover:text-gray-600" />
          ) : (
            <ChevronDown size={15} className="text-gray-400 group-hover:text-gray-600" />
          )}
          <span className="text-xs sm:text-sm font-bold text-[#2d3436]">{selectedYear}</span>
        </div>
        <span className="text-[11px] font-semibold text-gray-400">
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
        </span>
      </div>

      {/* ── Year Content ── */}
      {isYearExpanded && (
        <div>
          {/* ZERO STATE: When no records exist */}
          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200/90 bg-[#fafbfc]/50 py-12 px-6 text-center my-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center mx-auto mb-3 text-gray-400">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-[#2d3436]">
                No emergency expenses in {selectedYear}
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                Your emergency fund is fully intact for this year. Any unexpected hospital bills or major fees will appear here.
              </p>
            </div>
          ) : (
            /* ACTIVE EXPENSES LIST */
            <div className="divide-y divide-gray-50 border-t border-gray-50 mt-1">
              {expenses.map((item) => (
                <EmergencySpendRowItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Footnote Tip Box ── */}
      <div className="rounded-xl bg-[#fafbfc] border border-gray-100 p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-gray-500 mt-4">
        <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[#2d3436]">Have a planned or unexpected expense?</span>{" "}
          <span className="text-gray-400">
            You can record it here to track emergency spending. Your monthly expenses will stay clean and unaltered.
          </span>
        </div>
      </div>
    </div>
  )
}