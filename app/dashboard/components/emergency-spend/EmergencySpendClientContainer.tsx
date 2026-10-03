// app/dashboard/savings/emergency-spend/_components/EmergencySpendClientContainer.tsx
"use client"

import { useState } from "react"
import type { EmergencySpendPageData } from "@/app/dashboard/_db/emergencySpend"
import EmergencyBannerRail from "./EmergencyBannerRail"
import EmergencyStatsRow from "./EmergencyStatsRow"
import EmergencyCategoryTabs, { EmergencyCategoryTab } from "./EmergencyCategoryTabs"
import EmergencySpendLedger from "./EmergencySpendLedger"

export default function EmergencySpendClientContainer({
  initialData,
}: {
  initialData: EmergencySpendPageData
}) {
  const [selectedYear, setSelectedYear] = useState<number>(initialData.selectedYear)
  const [activeTab, setActiveTab] = useState<EmergencyCategoryTab>("all")

  // Filter items in memory by category
  const filteredExpenses = initialData.expenses.filter((item) => {
    if (activeTab === "all") return true
    return item.category === activeTab
  })

  return (
    <div className="space-y-4 sm:space-y-5">
      <EmergencyBannerRail
        selectedYear={selectedYear}
        availableYears={initialData.availableYears}
        allTimeSpend={initialData.allTimeTotalSpend}
        onYearChange={setSelectedYear}
      />

      <EmergencyStatsRow stats={initialData.stats} selectedYear={selectedYear} />

      <EmergencyCategoryTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      <EmergencySpendLedger expenses={filteredExpenses} selectedYear={selectedYear} />
    </div>
  )
}