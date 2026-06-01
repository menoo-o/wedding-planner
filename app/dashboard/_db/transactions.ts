// app/dashboard/_db/transactions.ts

import { createClient } from '@/utils/supabase/server'
import { CycleCalculationTransaction } from '@/lib/types'

export async function getCycleTransactions(
  householdId: string,
  cycleId: string
): Promise<CycleCalculationTransaction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, description, related_transaction_id, category_id, created_at, notes")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)

  if (error || !data) {
    console.error("Failed to fetch cycle transactions:", error)
    return []
  }

  return data as unknown as CycleCalculationTransaction[]
}

export async function getPrevCycleExpenses(
  householdId: string,
  cycleId: string
): Promise<{ amount: number }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .eq("transaction_type", "expense")

  if (error || !data) {
    console.error("Failed to fetch previous cycle expenses:", error)
    return []
  }

  return data
}

export async function getActiveReceivables(householdId: string, cycleId: string) {
  const supabase = await createClient()

  const { data: records, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, counterparty_name, description, created_at, notes, related_transaction_id")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .in("transaction_type", ["loan_out", "loan_return"])

  if (error) {
    console.error("Failed to pull active receivables ledger:", error.message)
    return []
  }

  if (!records) return []

  const settledLoanIds = new Set(
    records
      .filter((tx) => tx.transaction_type === "loan_return" && tx.related_transaction_id)
      .map((tx) => String(tx.related_transaction_id))
  )

  return records
    .filter((tx) => tx.transaction_type === "loan_out" && !settledLoanIds.has(String(tx.id)))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}