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
    <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm">
      {/* ── Ledger Header ── */}
      <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base font-semibold tracking-tight text-[#2d3436]">
              {isPlannedView ? "Planned Reserves Pipeline" : "Settled Outflows Ledger"}
            </h2>
            {isPlannedView ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold leading-none text-amber-700">
                <Clock size={10} strokeWidth={2} />
                Future Commitments
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold leading-none text-emerald-700">
                <CheckCircle2 size={10} strokeWidth={2} />
                Deducted
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-[13px]">
            {isPlannedView
              ? "Future commitments allocated against emergency reserves"
              : "One-off expenses deducted directly from the vault"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="block text-sm font-semibold tabular-nums text-[#2d3436]">
            Rs {currentTotal.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">{selectedYear} Total</span>
        </div>
      </div>

      {/* ── Year Accordion Trigger ── */}
      <button
        type="button"
        onClick={() => setIsYearExpanded((prev) => !prev)}
        aria-expanded={isYearExpanded}
        className="group flex w-full select-none items-center justify-between border-t border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8b9dc3]/50 sm:px-6"
      >
        <span className="flex items-center gap-2">
          {isYearExpanded ? (
            <ChevronUp size={15} strokeWidth={1.5} className="text-gray-400 group-hover:text-gray-600" />
          ) : (
            <ChevronDown size={15} strokeWidth={1.5} className="text-gray-400 group-hover:text-gray-600" />
          )}
          <span className="text-sm font-semibold tabular-nums text-[#2d3436]">{selectedYear}</span>
        </span>
        <span className="text-xs font-medium text-gray-500">
          {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
        </span>
      </button>

      {/* ── Year Content ── */}
      {isYearExpanded &&
        (expenses.length === 0 ? (
          /* ZERO STATE */
          <div className="border-t border-gray-100 p-4 sm:p-6">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center sm:py-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-sm">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-[#2d3436]">
                {isPlannedView
                  ? `No planned commitments for ${selectedYear}`
                  : `No settled expenses in ${selectedYear}`}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">
                {isPlannedView
                  ? "You don't have any upcoming semester fees, surgeries, or capital repairs scheduled."
                  : "Your emergency fund is fully intact. Any unexpected emergency payouts will appear here."}
              </p>
            </div>
          </div>
        ) : (
          /* ACTIVE EXPENSES LIST — rows draw their own bottom borders */
          <div className="border-t border-gray-100">
            {expenses.map((item) => (
              <EmergencySpendRowItem key={item.id} item={item} />
            ))}
          </div>
        ))}

      {/* ── Footnote ── */}
      <div className="border-t border-gray-100 p-4 sm:p-6">
        <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs leading-relaxed text-gray-600 sm:p-3.5">
          <Lightbulb size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber-500" />
          <p>
            <span className="font-semibold text-[#2d3436]">
              {isPlannedView ? "Planning ahead?" : "Non-operational spends."}
            </span>{" "}
            {isPlannedView
              ? "Planned items hold target dates for future disbursements without deducting from your vault liquidity until marked as paid."
              : "Settled emergency expenses bypass your monthly operating cycle, so your everyday burn rate and budget tracking stay accurate."}
          </p>
        </div>
      </div>
    </div>
  )
}