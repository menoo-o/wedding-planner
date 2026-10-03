// app/dashboard/savings/emergency-spend/_components/EmergencyBannerRail.tsx
"use client"

import { Calendar, Info, ShieldCheck, ChevronDown } from "lucide-react"

interface BannerProps {
  selectedYear: number
  availableYears: number[]
  allTimeSpend: number
  onYearChange: (year: number) => void
}

export default function EmergencyBannerRail({
  selectedYear,
  availableYears,
  allTimeSpend,
  onYearChange,
}: BannerProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-2.5 sm:p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* ── 1. Year Selector Pill ── */}
      <div className="relative inline-flex items-center">
        <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-[#2d3436]">
          <Calendar size={14} className="text-gray-400" />
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-transparent pr-4 cursor-pointer outline-none appearance-none font-bold text-[#2d3436]"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="text-gray-400 -ml-3 pointer-events-none" />
        </div>
      </div>

      {/* ── 2. All-Time Total Center Pill ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-y lg:border-y-0 lg:border-x border-gray-100/90 flex-1">
        <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
          <Info size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Emergency Spend (All time)
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#2d3436]">
              Rs {allTimeSpend.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">
            This shows your total spending from the emergency fund across all years.
          </p>
        </div>
      </div>

      {/* ── 3. Right Status Card ── */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50/50 border border-emerald-100/70 rounded-xl shrink-0">
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#00b894] shadow-2xs">
          <ShieldCheck size={14} />
        </div>
        <div className="text-[11px] leading-tight pr-2">
          <p className="font-bold text-[#2d3436]">Stay prepared</p>
          <p className="text-[10px] text-gray-400">Track and protect your finances.</p>
        </div>
      </div>
    </div>
  )
}