//app/dashboard/queries.ts

// import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'



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

  const activeLoans = records
    .filter((tx) => tx.transaction_type === "loan_out" && !settledLoanIds.has(String(tx.id)))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return activeLoans
}