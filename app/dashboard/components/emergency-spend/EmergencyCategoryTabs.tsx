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
  <div
    role="tablist"
    aria-label="Emergency spend categories"
    className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-gray-200/70 bg-gray-100/80 p-1 sm:inline-flex sm:w-auto"
  >
    {tabs.map(({ id, label, shortLabel, Icon, activeIcon }) => {
      const isActive = activeTab === id
      const count = id === "settled" ? settledCount : plannedCount

      return (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onSelectTab(id)}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b9dc3]/50 sm:px-4 ${
            isActive
              ? "border-gray-200/70 bg-white text-[#2d3436] shadow-sm"
              : "border-transparent text-gray-600 hover:text-[#2d3436]"
          }`}
        >
          <Icon
            size={14}
            strokeWidth={1.8}
            className={`shrink-0 ${isActive ? activeIcon : "text-gray-400"}`}
          />
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${
              isActive ? "bg-gray-100 text-[#2d3436]" : "bg-gray-200/70 text-gray-600"
            }`}
          >
            {count}
          </span>
        </button>
      )
    })}
  </div>
)
}


const tabs = [
  {
    id: "settled",
    label: "Settled Outflows",
    shortLabel: "Settled",
    Icon: CheckCircle2,
    activeIcon: "text-emerald-600",
  },
  {
    id: "planned",
    label: "Planned Reserves",
    shortLabel: "Planned",
    Icon: Clock,
    activeIcon: "text-amber-600",
  },
] as const
