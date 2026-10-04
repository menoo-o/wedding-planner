// app/dashboard/savings/emergency-spend/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getEmergencySpendData } from "@/app/dashboard/_db/emergencySpend"
import EmergencySpendClientContainer from "@/app/dashboard/components/emergency-spend/EmergencySpendClientContainer"
import EmergencySpendHeader from "@/app/dashboard/components/emergency-spend/EmergencySpendHeader"
import EmergencySpendSkeleton from "@/app/dashboard/components/emergency-spend/EmergencySpendSkeleton"
import { Suspense } from "react"

export default async function EmergencySpendPage() {
  return (
    <Suspense fallback={<EmergencySpendSkeleton />}>
      <EmergencySpendContent />
    </Suspense>
  )
}

// ── Data + Content ────────────────────────────────────────────

async function EmergencySpendContent() {
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

  const initialData = await getEmergencySpendData(member.household_id)
// app/dashboard/savings/emergency-spend/page.tsx
return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:px-0">
    <EmergencySpendHeader />
    <EmergencySpendClientContainer
      initialData={initialData}
      householdId={member.household_id}
    />
  </div>
  )
}