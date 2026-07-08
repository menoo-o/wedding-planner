// app/dashboard/_db/household.ts

import { createClient } from '@/utils/supabase/server'

// DASHBOARD PAGE

export type HouseholdMember = {
  household_id: string
  role: "admin" | string
  status: "active" | "inactive" | "pending" | string
  user_id: string
}

// 💡 New Type Contract for Savings Integration Data
export type HouseholdSavingsConfig = {
  id: string
  savings_wallet_name: string | null
  savings_balance: number
}

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

/**
 * 💼 Fetches the current isolated savings lockbox configurations 
 * for the household layout engine.
 */
export async function getHouseholdSavingsConfig(householdId: string): Promise<HouseholdSavingsConfig | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("households")
    .select("id, savings_wallet_name, savings_balance")
    .eq("id", householdId)
    .single()

  if (error || !data) {
    console.error("Failed to fetch household savings configurations:", error)
    return null
  }

  return {
    id: data.id,
    savings_wallet_name: data.savings_wallet_name,
    // Safely cast to numeric type for clean component-side math computations
    savings_balance: Number(data.savings_balance || 0)
  }
}