// app/dashboard/savings/emergency-spend/_components/EmergencySpendClientContainer.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { EmergencySpendPageData } from "@/app/dashboard/_db/emergencySpend"
import EmergencyBannerRail from "./EmergencyBannerRail"
import EmergencyStatsRow from "./EmergencyStatsRow"
import EmergencyCategoryTabs, { SpendViewTab } from "./EmergencyCategoryTabs"
import EmergencySpendLedger from "./EmergencySpendLedger"
import LogEmergencySpendModal from "./LogEmergencySpendModal"

export default function EmergencySpendClientContainer({
  initialData,
  householdId,
}: {
  initialData: EmergencySpendPageData
  householdId: string
}) {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number>(initialData.selectedYear)
  const [activeTab, setActiveTab] = useState<SpendViewTab>("settled")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Count items for each tab
  const settledItems = initialData.expenses.filter((e) => e.status === "paid")
  const plannedItems = initialData.expenses.filter((e) => e.status === "planned")

  // Filter display based on selected tab
  const displayedExpenses = activeTab === "settled" ? settledItems : plannedItems

  return (
    <div className="space-y-4 sm:space-y-5">
      <EmergencyBannerRail
        selectedYear={selectedYear}
        availableYears={initialData.availableYears}
        allTimeSpend={initialData.allTimeTotalSpend}
        onYearChange={setSelectedYear}
        onAddExpense={() => setIsModalOpen(true)}
      />

      <EmergencyStatsRow stats={initialData.stats} selectedYear={selectedYear} />

      <EmergencyCategoryTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        settledCount={settledItems.length}
        plannedCount={plannedItems.length}
      />


      <EmergencySpendLedger
        expenses={displayedExpenses}
        selectedYear={selectedYear}
        isPlannedView={activeTab === "planned"}
      />

      <LogEmergencySpendModal
        householdId={householdId}
        availableVaultBalance={initialData.stats.availableEmergencyBalance}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}