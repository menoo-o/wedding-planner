// app/dashboard/savings/emergency-spend/_components/EmergencySpendClientContainer.tsx
"use client"

import { useState } from "react"
import type { EmergencySpendPageData } from "@/app/dashboard/_db/emergencySpend"
import EmergencyBannerRail from "./EmergencyBannerRail"
import EmergencyStatsRow from "./EmergencyStatsRow"
import EmergencyCategoryTabs, { EmergencyCategoryTab } from "./EmergencyCategoryTabs"
import EmergencySpendLedger from "./EmergencySpendLedger"
import LogEmergencySpendModal from "./LogEmergencySpendModal"
import { useRouter } from "next/navigation"

export default function EmergencySpendClientContainer({
  initialData,
  householdId,
}: {
  initialData: EmergencySpendPageData
  householdId: string
}) {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number>(initialData.selectedYear)
  const [activeTab, setActiveTab] = useState<EmergencyCategoryTab>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        onAddExpense={() => setIsModalOpen(true)}
      />

      <EmergencyStatsRow stats={initialData.stats} selectedYear={selectedYear} />

      <EmergencyCategoryTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      <EmergencySpendLedger expenses={filteredExpenses} selectedYear={selectedYear} />

      {/* Dedicated CTA Modal */}
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