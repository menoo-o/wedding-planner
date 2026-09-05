// app/dashboard/_db/cycles.ts

import { createClient } from '@/utils/supabase/server'
import { MonthlyCycle } from '@/lib/types'

// Raw shape of a monthly_cycles row as Supabase returns it.
// Kept local to the db layer — every caller gets back a fully
// mapped/defaulted MonthlyCycle instead.
interface MonthlyCycleRow {
  id: string
  household_id: string
  created_at: string
  is_closed: boolean
  month: number
  year: number
  opening_balance: number | null
  opening_cash_balance: number | null
  opening_bank_balance: number | null
  days_in_cycle: number | null
}

function mapCycleRow(row: MonthlyCycleRow): MonthlyCycle {
  return {
    id: row.id,
    household_id: row.household_id,
    created_at: row.created_at,
    is_closed: row.is_closed,
    month: row.month,
    year: row.year,
    opening_balance: row.opening_balance ?? 0,
    opening_cash_balance: row.opening_cash_balance ?? 0,
    opening_bank_balance: row.opening_bank_balance ?? 0,
    days_in_cycle: row.days_in_cycle ?? 30,
  }
}

export interface CyclePair {
  active: MonthlyCycle | null
  previousId: string | null
  openingBalance: number
}

export async function getCyclePair(householdId: string): Promise<CyclePair> {
  const supabase = await createClient()

  // Two explicit, filtered queries instead of "last 2 rows overall" —
  // as a household accumulates cycles over time, that positional
  // assumption can silently break (e.g. the true active cycle falling
  // outside a limit(2) window). Filtering by is_closed directly removes
  // that risk regardless of history length.
  const [activeRes, previousRes] = await Promise.all([
    supabase
      .from("monthly_cycles")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("monthly_cycles")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_closed", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (activeRes.error) {
    console.error("Failed to fetch active cycle:", activeRes.error)
  }
  if (previousRes.error) {
    console.error("Failed to fetch previous cycle:", previousRes.error)
  }

  const active = activeRes.data
    ? mapCycleRow(activeRes.data as MonthlyCycleRow)
    : null
  const previousId = previousRes.data?.id ?? null
  const openingBalance = active?.opening_balance ?? 0

  return { active, previousId, openingBalance }
}

// Cycle-shape guard so callers (dashboard.ts) don't re-derive
// "do we have a valid cycle id" logic themselves.
export function getCycleTransactionArgs(cyclePair: CyclePair): {
  currentCycleId: string | null
  prevCycleId: string | null
} {
  return {
    currentCycleId: cyclePair.active?.id ?? null,
    prevCycleId: cyclePair.previousId,
  }
}

// Full cycle history for a household — e.g. a history/list view.
// Separate from getCyclePair since it serves a different shape of need
// (all rows vs. just active+previous).
export async function getAllCycles(householdId: string): Promise<MonthlyCycle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("monthly_cycles")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.error("Failed to fetch all cycles:", error)
    return []
  }

  return (data as MonthlyCycleRow[]).map(mapCycleRow)
}