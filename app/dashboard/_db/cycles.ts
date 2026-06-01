// app/dashboard/_db/cycles.ts

import { createClient } from '@/utils/supabase/server'
import { MonthlyCycle } from '@/lib/types'

export async function getActiveCycle(householdId: string): Promise<MonthlyCycle | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("monthly_cycles")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_closed", false)
    .single<MonthlyCycle>()

  if (error) {
    console.error("Failed to fetch monthly cycle:", error)
    return null
  }

  return data
}

export async function getPreviousCycleId(householdId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("monthly_cycles")
    .select("id")
    .eq("household_id", householdId)
    .eq("is_closed", true)
    .order("created_at", { ascending: false })
    .limit(1)

  return data && data.length > 0 ? data[0].id : null
}
