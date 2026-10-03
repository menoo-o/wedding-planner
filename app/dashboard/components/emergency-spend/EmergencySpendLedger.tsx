// app/dashboard/savings/emergency-spend/_components/EmergencySpendLedger.tsx
"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileText, Lightbulb, Clock, CheckCircle2 } from "lucide-react"
import type { EmergencySpendRow } from "@/app/dashboard/_db/emergencySpend"
import EmergencySpendRowItem from "./EmergencySpendRowItem"

interface LedgerProps {
  expenses: EmergencySpendRow[]
  selectedYear: number
  isPlannedView?: boolean // <── Accept isPlannedView prop
}

export default function EmergencySpendLedger({
  expenses,
  selectedYear,
  isPlannedView = false,
}: LedgerProps) {
  const [isYearExpanded, setIsYearExpanded] = useState(true)

  // Compute total for the current tab view
  const currentTotal = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-7 space-y-4">
      {/* ── Ledger Header ── */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#2d3436]">
              {isPlannedView ? "Planned Reserves Pipeline" : "Settled Outflows Ledger"}
            </h2>
            {isPlannedView ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                <Clock size={10} />
                Future Commitments
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 size={10} />
                Deducted
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isPlannedView
              ? "Future commitments allocated against emergency reserves"
              : "Historical one-off expenditures deducted directly from the vault"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#2d3436] block">
            Rs {currentTotal.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400">{selectedYear} Total</span>
        </div>
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
          {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* ── Year Content ── */}
      {isYearExpanded && (
        <div>
          {/* ZERO STATE */}
          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200/90 bg-[#fafbfc]/50 py-12 px-6 text-center my-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center mx-auto mb-3 text-gray-400">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-[#2d3436]">
                {isPlannedView
                  ? `No planned commitments for ${selectedYear}`
                  : `No settled expenses in ${selectedYear}`}
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                {isPlannedView
                  ? "You don't have any upcoming semester fees, surgeries, or capital repairs scheduled."
                  : "Your emergency fund is fully intact. Any unexpected emergency payouts will appear here."}
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
          <span className="font-semibold text-[#2d3436]">
            {isPlannedView ? "Planning ahead?" : "Non-operational spends"}
          </span>{" "}
          <span className="text-gray-400">
            {isPlannedView
              ? "Planned items hold target dates for future disbursements without deducting from your vault liquidity until marked as paid."
              : "All settled emergency expenses bypass your monthly operating cycle to keep your everyday burn rates and budget tracking accurate."}
          </span>
        </div>
      </div>
    </div>
  )
}