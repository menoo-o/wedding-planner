// app/dashboard/_db/household.ts

import { createClient } from '@/utils/supabase/server'
import { HouseholdMember } from '@/lib/types'

export async function getHouseholdMember(userId: string): Promise<HouseholdMember | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("household_members")
    .select("household_id, role, status, user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single<HouseholdMember>()

  if (error || !data) {
    console.error("Failed to fetch household member:", error)
    return null
  }

  return data
}
