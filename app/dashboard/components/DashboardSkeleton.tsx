// app/dashboard/_components/DashboardSkeleton.tsx

import {
  Wallet,
  TrendingDown,
  Scale,
  ArrowUpRight,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react"

export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0 relative pt-2">
      {/* ── Top Bar & Right Controls ──────────────────────────── */}
     <div className="flex items-center justify-between mb-6 sm:mb-8 min-h-[3rem]">
      <div className="max-w-[58%] lg:max-w-none">
        <h1 className="text-xl sm:text-2xl font-bold text-[#2d3436]">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Welcome back to your household ledger
        </p>
      </div>
    </div>
      {/* Below this the skeleton is fine! */}
      {/* ── Financial Snapshot Header ─────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-4">
          Financial Snapshot
        </h2>
      </div>

      {/* ── 4 Top Metric Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* 1. Liquidity */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100/80 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2 sm:mb-3">
            <Wallet size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
              Liquidity
            </span>
          </div>
          <div className="h-7 w-28 bg-gray-100 rounded-md animate-pulse my-1" />
          <div className="flex items-center gap-2 mt-2">
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            <span className="text-gray-300 text-xs">·</span>
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* 2. This Month Spend */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100/80 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2 sm:mb-3">
            <TrendingDown size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
              This Month Spend
            </span>
          </div>
          <div className="h-7 w-32 bg-gray-100 rounded-md animate-pulse my-1" />
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse mt-2" />
        </div>

        {/* 3. Obligations */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100/80 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2 sm:mb-3">
            <Scale size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
              Obligations
            </span>
          </div>
          <div className="h-7 w-12 bg-gray-100 rounded-md animate-pulse my-1" />
          <div className="flex items-center gap-2 mt-2">
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            <span className="text-gray-300 text-xs">·</span>
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* 4. Net Debt */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100/80 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2 sm:mb-3">
            <ArrowUpRight size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
              Net Debt
            </span>
          </div>
          <div className="h-7 w-24 bg-gray-100 rounded-md animate-pulse my-1" />
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
      </div>

      {/* ── Insight Cards Row ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
        {/* Credit & Debt */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-5">
            Credit & Debt
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Receivables</span>
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Payables</span>
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Net Position</span>
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Debt Load</span>
              <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Velocity & Runway */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-5">
            Velocity & Runway
          </h3>
          <div className="space-y-5">
            <div>
              <span className="text-sm text-gray-500 block mb-1">Monthly Burn</span>
              <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div>
              <span className="text-sm text-gray-500 block mb-2">Spending Velocity</span>
              <div className="w-full bg-gray-100 rounded-full h-2 animate-pulse" />
              <p className="text-[11px] text-gray-400 mt-1.5">Calculating burn rate...</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 block mb-1">Cash Runway</span>
              <div className="flex items-center gap-2">
                <Clock size={16} strokeWidth={1.5} className="text-gray-400" />
                <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Savings Vault */}
        <div className="bg-[#2d3436] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="absolute top-4 right-4 opacity-10">
            <Shield size={64} strokeWidth={1} />
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mb-10" />

          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">
              Savings Vault
            </span>
          </div>

          <p className="text-sm text-gray-300 mt-4 mb-1">Emergency Fund</p>
          <div className="h-9 w-32 bg-white/15 rounded-lg animate-pulse my-1" />

          <button
            type="button"
            disabled
            className="mt-6 w-full py-2.5 bg-white/10 rounded-xl text-sm font-medium text-white/80 transition-colors cursor-default"
          >
            Manage Vault
          </button>
        </div>
      </div>

      {/* ── Recent Activity + Spending Analysis ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
              Recent Activity
            </h2>
            <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
              View All <ChevronRight size={14} strokeWidth={1.5} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Spending Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-5">
            Spending Analysis
          </h3>
          <div className="space-y-5">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-2">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}