// app/dashboard/debts/_components/DebtsFilterControls.tsx
"use client"

import { Search, SlidersHorizontal } from "lucide-react"

export type TabType = "all" | "owed" | "owe"

interface DebtsFilterControlsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  totalCount: number
}

export default function DebtsFilterControls({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: DebtsFilterControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
      {/* Segmented Control */}
      <div className="inline-flex items-center p-1 bg-[#e4e7eb] rounded-xl w-fit">
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-white text-[#2d3436] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onTabChange("owed")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "owed"
              ? "bg-white text-[#2d3436] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          You're Owed
        </button>
        <button
          type="button"
          onClick={() => onTabChange("owe")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "owe"
              ? "bg-white text-[#2d3436] shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          You Owe
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200/80 rounded-xl placeholder-gray-400 text-[#2d3436] focus:outline-none focus:border-gray-400 transition-colors shadow-sm"
          />
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200/80 text-xs font-semibold text-[#2d3436] hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
        >
          <SlidersHorizontal size={14} className="stroke-[2]" />
          Filter
        </button>
      </div>
    </div>
  )
}