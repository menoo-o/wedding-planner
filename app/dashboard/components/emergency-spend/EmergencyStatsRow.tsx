// app/dashboard/savings/emergency-spend/_components/EmergencyStatsRow.tsx
"use client"

import { Wallet, TrendingUp, CreditCard, AlertTriangle, ChevronRight } from "lucide-react"

interface StatsProps {
  stats: {
    availableEmergencyBalance: number
    spentInYear: number
    yearOverYearDelta: number
    expensesCount: number
    categoryCountsText: string
    largestExpenseAmount: number
    largestExpenseTitle: string | null
  }
  selectedYear: number
}

export default function EmergencyStatsRow({ stats, selectedYear }: StatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* ── 1. Emergency Fund ── */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group cursor-pointer">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
              <Wallet size={14} strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-[#00b894] uppercase">
              Emergency Fund
            </span>
            <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#2d3436] tracking-tight mt-2">
            Rs {stats.availableEmergencyBalance.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Available balance</p>
        </div>
        <div className="w-full bg-emerald-500 h-1 rounded-full mt-3" />
      </div>

      {/* ── 2. Spent in Year ── */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group cursor-pointer">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <TrendingUp size={14} strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Spent in {selectedYear}
            </span>
            <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#2d3436] tracking-tight mt-2">
            Rs {stats.spentInYear.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
            <span>▼</span> vs last year ({stats.yearOverYearDelta}%)
          </p>
        </div>
        <div className="w-full bg-blue-500 h-1 rounded-full mt-3" />
      </div>

      {/* ── 3. Expenses Logged ── */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group cursor-pointer">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <CreditCard size={14} strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Expenses Logged
            </span>
            <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#2d3436] tracking-tight mt-2">
            {stats.expensesCount}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
            {stats.categoryCountsText}
          </p>
        </div>
        <div className="w-full bg-purple-500 h-1 rounded-full mt-3 opacity-20" />
      </div>

      {/* ── 4. Largest Expense ── */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group cursor-pointer">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-[#e17055] flex items-center justify-center">
              <AlertTriangle size={14} strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-[#e17055] uppercase">
              Largest Expense
            </span>
            <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#e17055] tracking-tight mt-2">
            -Rs {stats.largestExpenseAmount.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">
            {stats.largestExpenseTitle || "No expenses yet"}
          </p>
        </div>
        <div className="w-full bg-[#e17055] h-1 rounded-full mt-3" />
      </div>
    </div>
  )
}