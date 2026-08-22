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


// Get top 3 categories by spending
function getTopCategories(
  transactions: ExpenseTransaction[],
  allCategories: { id: string; name: string }[]
) {
  const categoryTotals = new Map<string, number>()
  transactions.forEach((tx) => {
    const catId = tx.category_id || "uncategorized"
    categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + tx.amount)
  })

  const sorted = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return sorted.map(([catId, total]) => {
    const cat = allCategories.find((c) => c.id === catId)
    return { id: catId, name: cat?.name || "General", total }
  })
}