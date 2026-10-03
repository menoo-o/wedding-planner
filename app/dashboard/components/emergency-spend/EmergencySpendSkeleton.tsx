// app/dashboard/savings/emergency-spend/_components/EmergencySpendSkeleton.tsx
import { Calendar, Info, ShieldCheck, Filter } from "lucide-react"

export default function EmergencySpendSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-pulse">
      {/* ── 1. Top Banner Rail Skeleton ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-2.5 sm:p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Year Pill Placeholder */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl w-24">
          <Calendar size={14} className="text-gray-300" />
          <div className="h-3.5 w-10 bg-gray-200 rounded" />
        </div>

        {/* Center: All-time Total Placeholder */}
        <div className="flex items-center gap-3 px-4 py-2 border-y lg:border-y-0 lg:border-x border-gray-100/90 flex-1">
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
            <Info size={14} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Total Emergency Spend (All time)
              </span>
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-2.5 w-48 sm:w-64 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Right: Stay Prepared Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50/40 border border-emerald-100/60 rounded-xl shrink-0">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#00b894]">
            <ShieldCheck size={14} />
          </div>
          <div className="text-[11px] leading-tight pr-2">
            <p className="font-bold text-[#2d3436]">Stay prepared</p>
            <p className="text-[10px] text-gray-400">Track and protect your finances.</p>
          </div>
        </div>
      </div>

      {/* ── 2. Stat Cards Grid Skeleton ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          { label: "Emergency Fund", border: "bg-emerald-500" },
          { label: "Spent in 2026", border: "bg-blue-500" },
          { label: "Expenses Logged", border: "bg-purple-500" },
          { label: "Largest Expense", border: "bg-[#e17055]" },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-gray-100" />
                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  {c.label}
                </span>
                <div className="w-3 h-3 bg-gray-100 rounded" />
              </div>
              <div className="h-7 w-24 bg-gray-200 rounded mt-2 mb-1" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
            <div className={`w-full ${c.border} h-1 rounded-full mt-3 opacity-30`} />
          </div>
        ))}
      </div>

      {/* ── 3. Category Tabs Skeleton ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {["All expenses", "Medical", "Education", "Legal", "Home repair"].map(
            (label, idx) => (
              <span
                key={label}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                  idx === 0
                    ? "bg-[#2d3436] text-white font-bold"
                    : "bg-white text-gray-400 border border-gray-100"
                }`}
              >
                {label}
              </span>
            )
          )}
        </div>
        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 shrink-0">
          <Filter size={13} strokeWidth={2} />
        </div>
      </div>

      {/* ── 4. Main Ledger Card Skeleton ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#2d3436]">Main List</h2>
            <p className="text-[11px] text-gray-400">Grouped by year instead of by day</p>
          </div>
          <div className="h-4 w-10 bg-gray-100 rounded" />
        </div>

        {/* Year Dropdown Skeleton Bar */}
        <div className="flex items-center justify-between py-1">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>

        {/* Pulsing Table Rows */}
        <div className="divide-y divide-gray-50 border-t border-gray-50">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3.5 sm:px-6 sm:py-4"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 md:w-5/12">
                <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-3.5 w-32 sm:w-44 bg-gray-200 rounded" />
                  <div className="h-2.5 w-24 bg-gray-100 rounded" />
                </div>
              </div>

              <div className="hidden md:block md:w-4/12 space-y-1">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-2.5 w-28 bg-gray-50 rounded" />
              </div>

              <div className="h-4 w-16 bg-rose-100/70 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}