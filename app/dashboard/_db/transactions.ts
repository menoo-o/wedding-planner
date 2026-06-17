// app/dashboard/_db/transactions.ts

import { createClient } from '@/utils/supabase/server'
import { CycleCalculationTransaction } from '@/lib/types'

// ── getCycleTransactions ──────────────────────────────────────
// Fetches all transactions for the active cycle.
// Added loan_status and reimbursement_status to the select.

export async function getCycleTransactions(
  householdId: string,
  cycleId: string
): Promise<CycleCalculationTransaction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, description, related_transaction_id, category_id, created_at, notes, loan_status, reimbursement_status")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.error("Failed to fetch cycle transactions:", error)
    return []
  }

  return data as unknown as CycleCalculationTransaction[]
}

// ── getPrevCycleExpenses ──────────────────────────────────────
// Unchanged — only needs amounts for burn rate fallback.

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

// ── getActiveReceivables ──────────────────────────────────────
// CHANGED: includes partially repaid loans (loan_status = 'partial')
// and computes remaining_amount so the UI can show how much is
// still outstanding rather than the original full amount.

export type ReceivableRecord = {
  id: string
  amount: number
  remaining_amount: number  // original minus all repayments so far
  loan_status: "pending" | "partial" | "settled"
  transaction_type: string
  payment_account: "cash" | "card" | "personal"
  counterparty_name: string | null
  description: string | null
  created_at: string
  notes: string | null
  related_transaction_id: string | null
}

export async function getActiveReceivables(
  householdId: string,
  cycleId: string
): Promise<ReceivableRecord[]> {
  const supabase = await createClient()

  // Fetch loan_out rows + any loan_return rows that reference them
  const { data: records, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, counterparty_name, description, created_at, notes, related_transaction_id, loan_status")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .in("transaction_type", ["loan_out", "loan_return"])

  if (error || !records) {
    console.error("Failed to pull active receivables ledger:", error?.message)
    return []
  }

  // Build repayments map: loan_out id → total repaid
  const repaymentsMap = new Map<string, number>()
  records
    .filter((tx) => tx.transaction_type === "loan_return" && tx.related_transaction_id)
    .forEach((tx) => {
      const prev = repaymentsMap.get(tx.related_transaction_id!) ?? 0
      repaymentsMap.set(tx.related_transaction_id!, prev + Number(tx.amount))
    })

  // Return loan_out rows that are not fully settled, with remaining_amount computed
  return records
    .filter((tx) => tx.transaction_type === "loan_out" && tx.loan_status !== "settled")
    .map((tx) => {
      const repaid = repaymentsMap.get(tx.id) ?? 0
      return {
        ...tx,
        amount:           Number(tx.amount),
        remaining_amount: Number(tx.amount) - repaid,
        loan_status:      tx.loan_status as "pending" | "partial" | "settled",
      }
    })
    .filter((tx) => tx.remaining_amount > 0) // safety: exclude if fully repaid but DB hasn't caught up
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ── getActivePayables ─────────────────────────────────────────
// CHANGED:
// - Loans: include 'partial' loan_status rows, compute remaining_amount
// - Expenses: reimbursement_status now has 'partial' — include pending + partial

export type PayableRecord = {
  id: string
  amount: number
  remaining_amount: number
  transaction_type: "loan_in" | "expense"
  loan_status: "pending" | "partial" | "settled" | null
  reimbursement_status: "pending" | "partial" | "settled" | null
  household_id: string
  cycle_id: string
  counterparty_name: string | null
  description: string | null
  created_at: string
  related_transaction_id: string | null
}

export async function getActivePayables(householdId: string): Promise<PayableRecord[]> {
  const supabase = await createClient()

  const { data: records, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, household_id, cycle_id, counterparty_name, description, created_at, related_transaction_id, reimbursement_status, loan_status")
    .eq("household_id", householdId)
    .in("transaction_type", ["loan_in", "loan_return", "settlement", "expense"])

  if (error || !records) {
    console.error("Failed to pull payables ledger:", error?.message)
    return []
  }

  // Build repayments map for loans: loan_in id → total repaid
  const repaymentsMap = new Map<string, number>()
  records
    .filter((tx) =>
      (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") &&
      tx.related_transaction_id
    )
    .forEach((tx) => {
      const prev = repaymentsMap.get(tx.related_transaction_id!) ?? 0
      repaymentsMap.set(tx.related_transaction_id!, prev + Number(tx.amount))
    })

  return records
    .filter((tx) => {
      // Loan payables: pending or partial (not settled, not a repayment row itself)
      const isActiveLoan =
        tx.transaction_type === "loan_in" &&
        tx.loan_status !== "settled"

      // Expense payables: someone else paid, still awaiting full reimbursement
      const isPendingExpense =
        tx.transaction_type === "expense" &&
        (tx.reimbursement_status === "pending" || tx.reimbursement_status === "partial")

      return isActiveLoan || isPendingExpense
    })
    .map((tx) => {
      const repaid = repaymentsMap.get(tx.id) ?? 0
      const original = Number(tx.amount)

      return {
        ...tx,
        amount:               original,
        // For expenses, remaining = full amount (partial reimbursements tracked separately via related rows)
        remaining_amount:     tx.transaction_type === "loan_in" ? original - repaid : original,
        transaction_type:     tx.transaction_type as "loan_in" | "expense",
        loan_status:          tx.loan_status as "pending" | "partial" | "settled" | null,
        reimbursement_status: tx.reimbursement_status as "pending" | "partial" | "settled" | null,
      }
    })
    .filter((tx) => tx.remaining_amount > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}