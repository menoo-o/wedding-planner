// app/dashboard/debts/_components/DebtsClientContainer.tsx
"use client"

import { useState, useMemo } from "react"
import type { DebtsPageData, MonthDebtsGroup } from "@/app/dashboard/_db/debt"
import DebtsHeader from "./DebtsHeader"
import DebtsStatsRow from "./DebtsStatsRow"
import PeopleRollupRail from "./PeopleRollupRail"
import DebtsFilterControls, { TabType } from "./DebtsFilterControls"
import DebtsLedger from "./DebtsLedger"
//
interface ContainerProps {
  initialData: DebtsPageData
}

export default function DebtsClientContainer({ initialData }: ContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [visibleMonthsCount, setVisibleMonthsCount] = useState<number>(1)

  // Filter groups in memory based on tab and selected person
  const filteredGroups = useMemo(() => {
    const rawGroups = initialData.groups || []
    const slicedGroups = rawGroups.slice(0, visibleMonthsCount)

    return slicedGroups.map((group): MonthDebtsGroup => {
      const filterItem = (d: (typeof group.needsAttention)[number]) => {
        if (activeTab !== "all" && d.direction !== activeTab) {
          return false
        }
        if (selectedPerson && d.counterparty.toLowerCase() !== selectedPerson.toLowerCase()) {
          return false
        }
        return true
      }

      const filteredAttention = group.needsAttention.filter(filterItem)
      const filteredSettled = group.settled.filter(filterItem)

      return {
        ...group,
        openCount: filteredAttention.length,
        needsAttention: filteredAttention,
        settled: filteredSettled,
      }
    })
  }, [initialData.groups, visibleMonthsCount, activeTab, selectedPerson])

  const handleLoadEarlierMonth = () => {
    if (visibleMonthsCount < (initialData.groups?.length ?? 1)) {
      setVisibleMonthsCount((prev) => prev + 1)
    }
  }
//app/dashboard/debts/_components/DebtsClientContainer.tsx
  return (
  <div className="space-y-3.5 sm:space-y-6 pb-20 sm:pb-6">
      <DebtsHeader />

      <DebtsStatsRow stats={initialData.stats} />

      {/* Tabs with clean background and no search/filter controls */}
      <DebtsFilterControls
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* People Rollup Rail (shows clean zero-state box if empty) */}
      <PeopleRollupRail
        people={initialData.peopleRollup}
        selectedPerson={selectedPerson}
        onSelectPerson={(name) =>
          setSelectedPerson((prev) => (prev === name ? null : name))
        }
      />

      {/* Main Ledger enclosed in the white card */}
      <DebtsLedger
        groups={filteredGroups}
        onLoadEarlierMonth={handleLoadEarlierMonth}
        hasMoreMonths={visibleMonthsCount < (initialData.groups?.length ?? 1)}
      />
    </div>
  )
}