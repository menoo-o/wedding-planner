// app/dashboard/savings/emergency-spend/_components/EmergencyCategoryTabs.tsx
"use client"

import { Filter } from "lucide-react"

export type EmergencyCategoryTab = "all" | "medical" | "education" | "legal" | "home_repair"

interface CategoryTabsProps {
  activeTab: EmergencyCategoryTab
  onSelectTab: (tab: EmergencyCategoryTab) => void
}

const TABS: { id: EmergencyCategoryTab; label: string }[] = [
  { id: "all", label: "All expenses" },
  { id: "medical", label: "Medical" },
  { id: "education", label: "Education" },
  { id: "legal", label: "Legal" },
  { id: "home_repair", label: "Home repair" },
]

export default function EmergencyCategoryTabs({ activeTab, onSelectTab }: CategoryTabsProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#2d3436] text-white shadow-xs font-bold"
                  : "bg-white text-gray-500 hover:text-[#2d3436] border border-gray-100"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      >
        <Filter size={13} strokeWidth={2} />
      </button>
    </div>
  )
}