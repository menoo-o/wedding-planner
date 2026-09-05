// app/dashboard/debts/page.tsx

import { Suspense } from "react"
import { connection } from "next/server"
import { getDashboardData } from "@/app/dashboard/_services/dashboard"
import { getDebtsPageData } from "@/app/dashboard/_db/debt"
import DebtsClientContainer from "@/app/dashboard/components/debts/DebtsClientContainer"
import DebtsSkeleton from "@/app/dashboard/components/debts/DebtsSkeleton"

async function DebtsDataFetcher() {
  // Opt in to dynamic rendering per Next.js server conventions
  await connection()

  const { householdMember } = await getDashboardData()
  const householdId = householdMember?.household_id ?? ""

  // Prefetch & normalize all active, child, and settled debt records upfront
  const initialData = await getDebtsPageData(householdId)

  return <DebtsClientContainer initialData={initialData} />
}

export default function DebtsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Suspense fallback={<DebtsSkeleton />}>
        <DebtsDataFetcher />
      </Suspense>
    </div>
  )
}