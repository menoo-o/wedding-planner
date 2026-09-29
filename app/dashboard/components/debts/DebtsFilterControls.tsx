// app/dashboard/debts/_components/DebtsFilterControls.tsx
"use client"

import type { DebtDirection } from "@/app/dashboard/_db/debt"

export type TabType = "all" | DebtDirection

interface DebtsFilterControlsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function DebtsFilterControls({
  activeTab,
  onTabChange,
}: DebtsFilterControlsProps) {
 return (
    <div className="flex items-center w-full overflow-x-auto scrollbar-none py-0.5">
      <div className="inline-flex items-center p-1 bg-[#e8ecf2] rounded-xl w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "all" ? "bg-white text-[#2d3436] shadow-sm font-bold" : "text-gray-500"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => onTabChange("you_are_owed")}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "you_are_owed" ? "bg-white text-[#2d3436] shadow-sm font-bold" : "text-gray-500"
          }`}
        >
          You&apos;re Owed
        </button>

        <button
          type="button"
          onClick={() => onTabChange("you_owe")}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "you_owe" ? "bg-white text-[#2d3436] shadow-sm font-bold" : "text-gray-500"
          }`}
        >
          You Owe
        </button>
      </div>
    </div>
  )
}