// app/dashboard/debts/_components/DebtsStatsRow.tsx

import { ArrowUpRight, Users, CheckCircle2, HelpCircle, TrendingUp } from "lucide-react"
import type { DebtsPageStats } from "@/app/dashboard/_db/debt"

interface DebtsStatsProps {
  stats: DebtsPageStats
  previousMonthDelta?: number // e.g. +3
}

// ── Decorative Emerald Trend Sparkline ──────────────────────────
function MiniSparkline({ color = "#00b894" }: { color?: string }) {
  return (
    <svg
      width="54"
      height="22"
      viewBox="0 0 54 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M2 18L13 13L24 17L35 6L44 11L52 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DebtsStatsRow({ stats, previousMonthDelta = 3 }: DebtsStatsProps) {
  const isAhead = stats.netDebtPosition >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* ── 1. Net Debt Position ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2 sm:mb-2.5">
            <span className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-center gap-1">
              Net Debt Position
              <HelpCircle size={12} className="text-gray-300 stroke-[2] hidden sm:inline" />
            </span>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                isAhead ? "bg-emerald-50 text-[#00b894]" : "bg-rose-50 text-[#e17055]"
              }`}
            >
              <ArrowUpRight
                size={15}
                strokeWidth={2}
                className={!isAhead ? "rotate-90 text-[#e17055]" : ""}
              />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#2d3436] tracking-tight">
            Rs {Math.abs(stats.netDebtPosition).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p
            className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1 ${
              isAhead ? "text-[#00b894]" : "text-[#e17055]"
            }`}
          >
            <TrendingUp size={13} strokeWidth={2.5} />
            +{previousMonthDelta} from last month
          </p>
          <div className="hidden sm:block">
            <MiniSparkline color={isAhead ? "#00b894" : "#e17055"} />
          </div>
        </div>
      </div>

      {/* ── 2. Total Owed to You ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2 sm:mb-2.5">
            <span className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-center gap-1">
              Total Owed to You
              <HelpCircle size={12} className="text-gray-300 stroke-[2] hidden sm:inline" />
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-[#00b894] flex items-center justify-center">
              <Users size={15} strokeWidth={2} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#2d3436] tracking-tight">
            Rs {stats.totalReceivables.toLocaleString()}
          </p>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-400 mt-3 font-normal truncate">
          Across {stats.receivablesPeopleCount}{" "}
          {stats.receivablesPeopleCount === 1 ? "person" : "people"}
        </p>
      </div>

      {/* ── 3. Total You Owe ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2 sm:mb-2.5">
            <span className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-center gap-1">
              Total You Owe
              <HelpCircle size={12} className="text-gray-300 stroke-[2] hidden sm:inline" />
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-[#e17055] flex items-center justify-center">
              <Users size={15} strokeWidth={2} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#e17055] tracking-tight">
            Rs {stats.totalPayables.toLocaleString()}
          </p>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-400 mt-3 font-normal truncate">
          Across {stats.payablesPeopleCount}{" "}
          {stats.payablesPeopleCount === 1 ? "person" : "people"}
        </p>
      </div>

      {/* ── 4. Cleared This Month ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2 sm:mb-2.5">
            <span className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-center gap-1">
              Cleared This Month
              <HelpCircle size={12} className="text-gray-300 stroke-[2] hidden sm:inline" />
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-100">
              <CheckCircle2 size={15} strokeWidth={2} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#2d3436] tracking-tight">
            Rs {stats.clearedThisMonth.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] sm:text-xs font-semibold text-[#00b894] flex items-center gap-1">
            <TrendingUp size={13} strokeWidth={2.5} />
            +{previousMonthDelta} from last month
          </p>
          <div className="hidden sm:block">
            <MiniSparkline color="#00b894" />
          </div>
        </div>
      </div>
    </div>
  )
}