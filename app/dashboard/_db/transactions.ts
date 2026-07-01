// app/dashboard/_db/transactions.ts

import { createClient } from '@/utils/supabase/server'
import { CycleCalculationTransaction } from '@/lib/types'

// ── getCycleTransactions ──────────────────────────────────────
// Fetches all transactions for the active cycle.

export async function getCycleTransactions(
  householdId: string,
  cycleId: string
): Promise<CycleCalculationTransaction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, description, related_transaction_id, category_id, created_at, notes, loan_status, reimbursement_status, paid_by, counterparty_name")
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

// ── Receivables ledger ─────────────────────────────────────────
// One query fetches loan_out + loan_return for the cycle.
// Split into active (still owed) vs settled (fully repaid) in JS —
// no second DB round-trip needed for the "see past history" button.

export type ReceivableRecord = {
  id: string
  amount: number
  remaining_amount: number
  loan_status: "pending" | "partial" | "settled"
  transaction_type: string
  payment_account: "cash" | "card" | "personal";
  counterparty_name: string | null
  description: string | null
  created_at: string
  notes: string | null
  related_transaction_id: string | null
}

export async function getReceivablesLedger(
  householdId: string,
  cycleId: string
): Promise<{ active: ReceivableRecord[]; settled: ReceivableRecord[] }> {
  const supabase = await createClient()

  const { data: records, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, counterparty_name, description, created_at, notes, related_transaction_id, loan_status")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .in("transaction_type", ["loan_out", "loan_return"])

  if (error || !records) {
    console.error("Failed to pull receivables ledger:", error?.message)
    return { active: [], settled: [] }
  }

  // Map: original loan_out id → total repaid via loan_return rows
  const repaymentsMap = new Map<string, number>()
  records
    .filter((tx) => tx.transaction_type === "loan_return" && tx.related_transaction_id)
    .forEach((tx) => {
      const prev = repaymentsMap.get(tx.related_transaction_id!) ?? 0
      repaymentsMap.set(tx.related_transaction_id!, prev + Number(tx.amount))
    })

  const active: ReceivableRecord[] = []
  const settled: ReceivableRecord[] = []

  // Classification rule: transaction_type === "loan_out" → Receivables
  records
    .filter((tx) => tx.transaction_type === "loan_out")
    .forEach((tx) => {
      const repaid = repaymentsMap.get(tx.id) ?? 0
      const remaining = Math.max(0, Number(tx.amount) - repaid)
      const record: ReceivableRecord = {
        ...tx,
        amount: Number(tx.amount),
        remaining_amount: remaining,
        loan_status: tx.loan_status as "pending" | "partial" | "settled",
      }
      const isSettled = tx.loan_status === "settled" || remaining <= 0
      ;(isSettled ? settled : active).push(record)
    })

  const sortDesc = (a: ReceivableRecord, b: ReceivableRecord) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

  return { active: active.sort(sortDesc), settled: settled.sort(sortDesc) }
}

// Backward-compatible wrapper — existing callers (e.g. /dashboard/page.tsx)
// keep working unchanged, still just one DB query under the hood.
export async function getActiveReceivables(
  householdId: string,
  cycleId: string
): Promise<ReceivableRecord[]> {
  const { active } = await getReceivablesLedger(householdId, cycleId)
  return active
}

// ── Payables ledger ───────────────────────────────────────────
// One query fetches loan_in + loan_return + settlement + expense.
// Split into active vs settled, with reimbursements identified by
// the rule: transaction_type === "expense" && paid_by === "other".

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

export async function getPayablesLedger(
  householdId: string
): Promise<{ active: PayableRecord[]; settled: PayableRecord[] }> {
  const supabase = await createClient()

  const { data: records, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, household_id, cycle_id, counterparty_name, description, created_at, related_transaction_id, reimbursement_status, loan_status, paid_by")
    .eq("household_id", householdId)
    .in("transaction_type", ["loan_in", "loan_return", "settlement", "expense"])

  if (error || !records) {
    console.error("Failed to pull payables ledger:", error?.message)
    return { active: [], settled: [] }
  }

  // Map: original loan_in / expense id → total repaid via loan_return / settlement rows
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

  const active: PayableRecord[] = []
  const settled: PayableRecord[] = []

  records.forEach((tx) => {
    // Classification rule, as specified:
    //   loan_out          → Receivables   (handled in getReceivablesLedger)
    //   loan_in            → Payables
    //   expense + paid_by === "other" → Reimbursements
    const isLoanPayable = tx.transaction_type === "loan_in"
    const isReimbursement = tx.transaction_type === "expense" && tx.paid_by === "other"

    if (!isLoanPayable && !isReimbursement) return // skip loan_return/settlement rows themselves

    const original = Number(tx.amount)
    const repaid = isLoanPayable ? (repaymentsMap.get(tx.id) ?? 0) : 0
    const remaining = isLoanPayable ? Math.max(0, original - repaid) : original
    const status = isLoanPayable ? tx.loan_status : tx.reimbursement_status

    const record: PayableRecord = {
      ...tx,
      amount: original,
      remaining_amount: remaining,
      transaction_type: tx.transaction_type as "loan_in" | "expense",
      loan_status: tx.loan_status as "pending" | "partial" | "settled" | null,
      reimbursement_status: tx.reimbursement_status as "pending" | "partial" | "settled" | null,
    }

    const isSettled = status === "settled" || (isLoanPayable && remaining <= 0)
    ;(isSettled ? settled : active).push(record)
  })

  const sortDesc = (a: PayableRecord, b: PayableRecord) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

  return { active: active.sort(sortDesc), settled: settled.sort(sortDesc) }
}

// Backward-compatible wrapper — existing callers keep working unchanged.
export async function getActivePayables(householdId: string): Promise<PayableRecord[]> {
  const { active } = await getPayablesLedger(householdId)
  return active
}