
// app/dashboard/_db/debt.ts

import { createClient } from '@/utils/supabase/server'
import { LifetimeDebtTransaction } from '@/lib/types'

// ── getLifetimeDebtTransactions ───────────────────────────────
// CHANGED: added loan_status to the select so computeLifetimeDebt
// can skip already-settled rows without doing the math itself.
// Everything else is unchanged — cross-cycle, all loan types.

export async function getLifetimeDebtTransactions(
  householdId: string
): Promise<LifetimeDebtTransaction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, related_transaction_id, loan_status")
    .eq("household_id", householdId)
    .in("transaction_type", ["loan_out", "loan_in", "loan_return", "settlement"])

  if (error || !data) {
    console.error("Failed to fetch lifetime debt transactions:", error)
    return []
  }

  return data as unknown as LifetimeDebtTransaction[]
}