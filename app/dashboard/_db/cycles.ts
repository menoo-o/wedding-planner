// app/dashboard/_db/cycles.ts

import { createClient } from '@/utils/supabase/server'
import { MonthlyCycle } from '@/lib/types'


export async function getCyclePair(householdId: string): Promise<{
  active: MonthlyCycle | null
  previousId: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("monthly_cycles")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(2)

  if (error || !data) {
    console.error("Failed to fetch cycles:", error)
    return { active: null, previousId: null }
  }

  const active = data.find((c) => !c.is_closed) ?? null
  const previous = data.find((c) => c.is_closed) ?? null
  return { active, previousId: previous?.id ?? null }
}