// app/dashboard/debts/_components/DebtsClientContainer.tsx
"use client"

import { useState, useMemo } from "react"
import type { DebtsPageData } from "@/app/dashboard/_db/debt"
import DebtsHeader from "./DebtsHeader"
import DebtsStatsRow from "@/app/dashboard/components/debts/DebtsStatsRow"
import PeopleRollupRail from "./PeopleRollupRail"
import DebtsFilterControls, { TabType } from "./DebtsFilterControls"
import DebtsLedger from "./DebtsLedger"

interface ContainerProps {
  initialData: DebtsPageData
}

export default function DebtsClientContainer({ initialData }: ContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)

  const filteredDebts = useMemo(() => {
    let list = initialData.debts

    if (activeTab === "owed") {
      list = list.filter((d) => d.direction === "receivable")
    } else if (activeTab === "owe") {
      list = list.filter((d) => d.direction === "payable")
    }

    if (selectedPerson) {
      list = list.filter(
        (d) => d.counterparty_name.toLowerCase() === selectedPerson.toLowerCase()
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (d) =>
          d.counterparty_name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      )
    }

    return list
  }, [initialData.debts, activeTab, selectedPerson, searchQuery])

  return (
    <div className="space-y-6">
      <DebtsHeader />
      <DebtsStatsRow stats={initialData.stats} />
      <DebtsFilterControls
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={initialData.debts.length}
      />
      <PeopleRollupRail
        people={initialData.peopleRollup}
        selectedPerson={selectedPerson}
        onSelectPerson={(name) =>
          setSelectedPerson((prev) => (prev === name ? null : name))
        }
      />
      <DebtsLedger debts={filteredDebts} />
    </div>
  )
}