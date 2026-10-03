// app/dashboard/savings/emergency-spend/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getEmergencySpendData } from "@/app/dashboard/_db/emergencySpend"
import EmergencySpendClientContainer from "@/app/dashboard/components/emergency-spend/EmergencySpendClientContainer"
import EmergencySpendHeader from "@/app/dashboard/components/emergency-spend/EmergencySpendHeader"
import EmergencySpendSkeleton from "@/app/dashboard/components/emergency-spend/EmergencySpendSkeleton"
import { Suspense } from "react"


// Async child component that triggers Suspense streaming
async function EmergencySpendDataLoader({ householdId }: { householdId: string }) {
  const initialData = await getEmergencySpendData(householdId)
  return <EmergencySpendClientContainer initialData={initialData} />
}

export default async function EmergencySpendPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!member) redirect("/dashboard")

  return (
    <div className="px-4 py-4 sm:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* 1. Header renders immediately (0 latency, no loading flash) */}
      <EmergencySpendHeader />

      {/* 2. Suspense boundary streaming the skeleton while fetching data */}
      <Suspense fallback={<EmergencySpendSkeleton />}>
        <EmergencySpendDataLoader householdId={member.household_id} />
      </Suspense>
    </div>
  )
}