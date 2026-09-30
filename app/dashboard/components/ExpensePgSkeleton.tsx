// app/dashboard/expenses/_components/ExpensesSkeleton.tsx

import {
  TrendingDown,
  Scale,
  Wallet,
  Clock,
  ArrowLeftRight,
  Filter,
  Plus,
  RotateCw,
  ChevronRight,
} from "lucide-react"

export default function ExpensesSkeleton() {
  return (
    <div className="space-y-3.5 sm:space-y-5 pb-20 sm:pb-6 animate-pulse">
      {/* ── 1. Header with Top-Right Action Controls ── */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2d3436] tracking-tight">
            Expenses
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">September 2026</p>
        </div>

        {/* Top-Right Control Island */}
        
      </div>

      {/* ── 2. Stat Cards Grid (Accurate Icons & Labels) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Total Spend */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                <TrendingDown size={13} strokeWidth={2} className="text-gray-400" />
                Total Spend
              </span>
            </div>
            <div className="h-7 w-28 bg-rose-100/60 rounded-lg animate-pulse my-1" />
          </div>
          <div className="h-3 w-24 bg-gray-100 rounded mt-3 animate-pulse" />
        </div>

        {/* Card 2: Pending Payables */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                <Scale size={13} strokeWidth={2} className="text-gray-400" />
                Pending Payables
              </span>
            </div>
            <div className="h-7 w-12 bg-gray-200/80 rounded-lg animate-pulse my-1" />
          </div>
          <div className="h-3 w-20 bg-gray-100 rounded mt-3 animate-pulse" />
        </div>

        {/* Card 3: Liquidity */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                <Wallet size={13} strokeWidth={2} className="text-gray-400" />
                Liquidity
              </span>
              <ArrowLeftRight size={12} className="text-gray-300" />
            </div>
            <div className="h-7 w-20 bg-gray-200/80 rounded-lg animate-pulse my-1" />
          </div>
          <div className="h-3 w-28 bg-gray-100 rounded mt-3 animate-pulse" />
        </div>

        {/* Card 4: Burn Rate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                <Clock size={13} strokeWidth={2} className="text-gray-400" />
                Burn Rate
              </span>
            </div>
            <div className="h-7 w-20 bg-gray-200/80 rounded-lg animate-pulse my-1" />
          </div>
          <div className="h-3 w-24 bg-gray-100 rounded mt-3 animate-pulse" />
        </div>
      </div>

      {/* ── 3. Tabs + Filter Action ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 bg-[#eef1f5] rounded-xl overflow-x-auto scrollbar-none">
          <span className="px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-[#2d3436] shadow-sm whitespace-nowrap">
            All expenses
          </span>
          <span className="px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 whitespace-nowrap">
            Personal Care
          </span>
          <span className="px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 whitespace-nowrap">
            Household
          </span>
          <span className="px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 whitespace-nowrap">
            Food
          </span>
        </div>

        <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 shrink-0">
          <Filter size={14} strokeWidth={2} />
        </div>
      </div>

      {/* ── 4. Transaction Date Groups (Matching White Cards) ── */}
      <div className="space-y-5">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-2">
            {/* Group Date Header + Running Total */}
            <div className="flex items-center justify-between px-1">
              <div className="h-3.5 w-40 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-rose-100/70 rounded animate-pulse" />
            </div>

            {/* Structured White Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-gray-50">
              {[1, 2].map((row) => (
                <div key={row} className="p-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Currency Coin Icon Placeholder */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 font-bold text-xs shrink-0">
                      $
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="h-3.5 w-32 sm:w-44 bg-gray-200/80 rounded animate-pulse" />
                      <div className="h-2.5 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-4 w-14 bg-gray-200/80 rounded animate-pulse" />
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}