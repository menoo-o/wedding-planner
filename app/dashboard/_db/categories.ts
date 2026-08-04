// app/dashboard/_db/categories.ts

import { createClient } from '@/utils/supabase/server'
import { Category } from '@/lib/types'

export async function getHouseholdCategories(householdId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, household_id, name")
    .eq("household_id", householdId)
    .overrideTypes<Category[]>()

  if (error || !data) {
    console.error("Failed to fetch categories:", error)
    return []
  }

  return data
}
