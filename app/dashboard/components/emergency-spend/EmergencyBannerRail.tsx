// app/dashboard/savings/emergency-spend/_components/EmergencyBannerRail.tsx
"use client"

import { Calendar, Info, Plus, ShieldAlert, ChevronDown } from "lucide-react"

interface BannerProps {
  selectedYear: number
  availableYears: number[]
  allTimeSpend: number
  onYearChange: (year: number) => void
  onAddExpense?: () => void
}

export default function EmergencyBannerRail({
  selectedYear,
  availableYears,
  allTimeSpend,
  onYearChange,
  onAddExpense,
}: BannerProps) {
  // app/dashboard/savings/emergency-spend/_components/EmergencyBannerRail.tsx
return (
  <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/70 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:gap-4">
    {/* Mobile: year + CTA share the first row. Desktop: wrapper dissolves (lg:contents)
        so year / total / CTA sit in one row via the order-* classes. */}
    <div className="flex items-center justify-between gap-3 lg:contents">
      {/* ── 1. Year Selector ── */}
      <div className="relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200/70 bg-gray-50 px-3.5 text-xs font-semibold text-[#2d3436] focus-within:ring-2 focus-within:ring-[#8b9dc3]/40 lg:order-1">
        <Calendar size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
        <select
          aria-label="Select year"
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="cursor-pointer appearance-none bg-transparent pr-5 font-semibold tabular-nums text-[#2d3436] outline-none"
        >
          {availableYears.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className="pointer-events-none absolute right-3 text-gray-400"
        />
      </div>

      {/* ── 3. CTA ── */}
      <button
        type="button"
        onClick={onAddExpense}
        className="group inline-flex min-h-10 shrink-0 items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-left text-white shadow-[0_2px_8px_rgba(5,150,105,0.25)] transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-[0_4px_12px_rgba(5,150,105,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2 active:scale-[0.98] lg:order-3"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20 transition-transform group-hover:rotate-12">
          <ShieldAlert size={14} strokeWidth={1.8} />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-semibold tracking-wide">
            <span className="sm:hidden">Log Spend</span>
            <span className="hidden sm:inline">Log Emergency Spend</span>
          </span>
          <span className="hidden text-[11px] text-emerald-50 sm:block">
            Draw directly from Vault
          </span>
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Plus size={12} strokeWidth={2.5} />
        </span>
      </button>
    </div>

    {/* ── 2. All-Time Total ── */}
    <div className="flex min-w-0 flex-1 items-center gap-3 border-t border-gray-100 pt-3 lg:order-2 lg:border-x lg:border-t-0 lg:px-4 lg:pt-0">
      <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 sm:flex">
        <Info size={14} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 sm:justify-start">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            <span className="sm:hidden">All-time spend</span>
            <span className="hidden sm:inline">Total Emergency Spend (All time)</span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-[#2d3436]">
            Rs {allTimeSpend.toLocaleString()}
          </span>
        </div>
        <p className="mt-0.5 hidden truncate text-[11px] text-gray-500 sm:block">
          Total spent from the emergency fund across all years.
        </p>
      </div>
    </div>
  </div>
)}