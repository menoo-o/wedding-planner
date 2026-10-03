// app/dashboard/savings/emergency-spend/_components/EmergencyCategoryTabs.tsx
"use client"

import { CheckCircle2, Clock } from "lucide-react"

export type SpendViewTab = "settled" | "planned"

interface TabsProps {
  activeTab: SpendViewTab
  onSelectTab: (tab: SpendViewTab) => void
  settledCount: number
  plannedCount: number
}

export default function EmergencyCategoryTabs({
  activeTab,
  onSelectTab,
  settledCount,
  plannedCount,
}: TabsProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <div className="flex items-center p-1 bg-gray-100/80 rounded-2xl border border-gray-200/50">
        {/* Tab 1: Settled Outflows */}
        <button
          type="button"
          onClick={() => onSelectTab("settled")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "settled"
              ? "bg-white text-[#2d3436] shadow-sm"
              : "text-gray-500 hover:text-[#2d3436]"
          }`}
        >
          <CheckCircle2
            size={14}
            className={activeTab === "settled" ? "text-emerald-500" : "text-gray-400"}
          />
          <span>Settled Outflows</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "settled"
                ? "bg-gray-100 text-[#2d3436]"
                : "bg-gray-200/70 text-gray-500"
            }`}
          >
            {settledCount}
          </span>
        </button>

        {/* Tab 2: Planned Reserves */}
        <button
          type="button"
          onClick={() => onSelectTab("planned")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "planned"
              ? "bg-white text-[#2d3436] shadow-sm"
              : "text-gray-500 hover:text-[#2d3436]"
          }`}
        >
          <Clock
            size={14}
            className={activeTab === "planned" ? "text-amber-500" : "text-gray-400"}
          />
          <span>Planned Reserves</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "planned"
                ? "bg-gray-100 text-[#2d3436]"
                : "bg-gray-200/70 text-gray-500"
            }`}
          >
            {plannedCount}
          </span>
        </button>
      </div>
    </div>
  )
}