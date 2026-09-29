// app/dashboard/debts/_components/DebtsLedger.tsx
"use client"

import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react"
import type { MonthDebtsGroup } from "@/app/dashboard/_db/debt"
import DebtRowItem from "./DebtRowItem"

interface DebtsLedgerProps {
  groups: MonthDebtsGroup[]
  onLoadEarlierMonth?: () => void
  hasMoreMonths?: boolean
}

export default function DebtsLedger({
  groups,
  onLoadEarlierMonth,
  hasMoreMonths = false,
}: DebtsLedgerProps) {
  // Track open state for each month group (default to open)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() =>
    groups.reduce((acc, g) => ({ ...acc, [g.monthYearLabel]: true }), {})
  )

  // Track collapsed status for the "Settled" section in each month
  const [expandedSettled, setExpandedSettled] = useState<Record<string, boolean>>({})

  const toggleMonth = (label: string) => {
    setOpenMonths((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const toggleSettled = (label: string) => {
    setExpandedSettled((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  // The bottom-most visible month provides the label for "Load [PreviousMonth]"
  const lowestVisibleMonth = groups[groups.length - 1]

  return (
    /* ── Outer White Table/Card Wrapper (Fixes 1st Issue: Blank Background) ── */
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
      <div className="space-y-8">
        {groups.map((group, groupIdx) => {
          const isMonthExpanded = openMonths[group.monthYearLabel] ?? true
          const isSettledExpanded = expandedSettled[group.monthYearLabel] ?? false
          const hasNoDebts =
            group.needsAttention.length === 0 && group.settled.length === 0
          const isLastGroup = groupIdx === groups.length - 1

          return (
            <div key={group.monthYearLabel} className="relative pl-6 sm:pl-8">
              {/* Continuous Timeline Rail */}
              {!isLastGroup && (
                <div className="absolute left-2.5 top-3.5 bottom-0 w-[1.5px] bg-gray-200 -translate-x-1/2" />
              )}

              {/* Timeline Bullet Node */}
              <div className="absolute left-2.5 top-2.5 w-2.5 h-2.5 rounded-full bg-[#8b9dc3] -translate-x-1/2 border-2 border-white ring-2 ring-gray-100 z-10" />

              {/* Month Header Bar */}
              <div
                onClick={() => toggleMonth(group.monthYearLabel)}
                className="flex items-center justify-between mb-4 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-[#2d3436] tracking-tight group-hover:text-black transition-colors">
                    {group.monthYearLabel}
                  </h2>

                  {group.openCount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                      {group.openCount} open
                    </span>
                  ) : !hasNoDebts ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                      All settled
                    </span>
                  ) : null}
                </div>

                <div className="p-1 rounded-lg text-gray-400 group-hover:text-gray-600 transition-colors">
                  {isMonthExpanded ? (
                    <ChevronUp size={17} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={17} strokeWidth={2} />
                  )}
                </div>
              </div>

              {/* Collapsible Month Content */}
              {isMonthExpanded && (
                <div className="transition-all">
                  {/* SCENARIO A: Empty State for Zero Transactions */}
                  {hasNoDebts ? (
                    <div className="rounded-2xl border border-dashed border-gray-200/90 bg-[#fafbfc]/60 py-12 px-6 sm:py-14 text-center my-2">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <FileText size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold text-[#2d3436]">
                        No loans or debts logged in {group.monthYearLabel.split(" ")[0]}
                      </h3>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                        You haven&apos;t added any loans, borrowed or lent anything this month.
                      </p>
                    </div>
                  ) : (
                    /* SCENARIO B: Active Debts */
                    <div className="space-y-5 my-2">
                      {/* 1. Needs Attention Section */}
                      {group.needsAttention.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 px-1 text-rose-500">
                            <AlertCircle size={15} strokeWidth={2.2} />
                            <div>
                              <span className="text-xs font-bold text-rose-500">
                                Needs Attention
                              </span>
                              <span className="text-[11px] text-gray-400 ml-2 font-normal">
                                Pending or partial payments
                              </span>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                            {group.needsAttention.map((debt) => (
                              <DebtRowItem
                                key={debt.id}
                                debt={debt}
                                variant="attention"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Settled Accordion Section */}
                      {group.settled.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleSettled(group.monthYearLabel)}
                            className="w-full flex items-center justify-between px-1 text-left group"
                          >
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2
                                size={15}
                                strokeWidth={2}
                                className="text-gray-400 group-hover:text-emerald-500 transition-colors"
                              />
                              <span className="text-xs font-bold text-gray-600 group-hover:text-[#2d3436] transition-colors">
                                Settled
                              </span>
                              <span className="text-[11px] text-gray-400 font-normal">
                                {group.settled.length} settled — tap to{" "}
                                {isSettledExpanded ? "collapse" : "expand"}
                              </span>
                            </div>

                            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                              {isSettledExpanded ? (
                                <ChevronUp size={15} strokeWidth={2} />
                              ) : (
                                <ChevronDown size={15} strokeWidth={2} />
                              )}
                            </div>
                          </button>

                          {isSettledExpanded && (
                            <div className="bg-white/80 rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all">
                              {group.settled.map((debt) => (
                                <DebtRowItem
                                  key={debt.id}
                                  debt={debt}
                                  variant="settled"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* ── Persistent "Load More" CTA (Fixes 2nd Issue: Outside Collapsible Month) ── */}
        {hasMoreMonths && lowestVisibleMonth?.previousMonthLabel && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={onLoadEarlierMonth}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200/90 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <ChevronDown size={14} className="text-gray-400" />
              Load {lowestVisibleMonth.previousMonthLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}