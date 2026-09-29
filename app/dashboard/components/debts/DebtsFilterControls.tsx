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
    <div className="flex items-center">
      {/* ── Tabs with distinct pill container background ── */}
      <div className="inline-flex items-center p-1 bg-[#e8ecf2] rounded-xl">
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-white text-[#2d3436] shadow-sm font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => onTabChange("you_are_owed")}
          className={`px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "you_are_owed"
              ? "bg-white text-[#2d3436] shadow-sm font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          You&apos;re Owed
        </button>

        <button
          type="button"
          onClick={() => onTabChange("you_owe")}
          className={`px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "you_owe"
              ? "bg-white text-[#2d3436] shadow-sm font-bold"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          You Owe
        </button>
      </div>
    </div>
  )
}