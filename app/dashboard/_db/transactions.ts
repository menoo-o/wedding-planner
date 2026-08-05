// app/dashboard/_db/transactions.ts

import { createClient } from '@/utils/supabase/server'
import { CycleCalculationTransaction } from '@/lib/types'

// ── getCycleTransactions ──────────────────────────────────────

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
  _cycleId?: string // Ignored to ensure cross-cycle persistence
): Promise<{ active: ReceivableRecord[]; settled: ReceivableRecord[] }> {
  const supabase = await createClient()

  const { data: records, error } = await supabase
    .from("transactions")
    .select(
      "id, amount, transaction_type, payment_account, counterparty_name, description, created_at, notes, related_transaction_id, loan_status"
    )
    .eq("household_id", householdId)
    .in("transaction_type", ["loan_out", "loan_return"])

  if (error || !records) {
    console.error("Failed to pull receivables ledger:", error?.message)
    return { active: [], settled: [] }
  }

  // Map: parent loan ID -> total amount repaid
  const repaymentsMap = new Map<string, number>()

  records
    .filter((tx) => tx.transaction_type === "loan_return" && tx.related_transaction_id)
    .forEach((tx) => {
      const prev = repaymentsMap.get(tx.related_transaction_id!) ?? 0
      repaymentsMap.set(tx.related_transaction_id!, prev + Number(tx.amount))
    })

  const active: ReceivableRecord[] = []
  const settled: ReceivableRecord[] = []

  records
    .filter((tx) => tx.transaction_type === "loan_out")
    .forEach((tx) => {
      const originalAmount = Number(tx.amount)
      const repaid = repaymentsMap.get(tx.id) ?? 0
      const remaining = Math.max(0, originalAmount - repaid)

      // Dynamic status resolution
      let currentStatus: "pending" | "partial" | "settled" = "pending"
      if (remaining <= 0) {
        currentStatus = "settled"
      } else if (repaid > 0) {
        currentStatus = "partial"
      } else {
        currentStatus = (tx.loan_status as "pending" | "partial" | "settled") || "pending"
      }

      const record: ReceivableRecord = {
        ...tx,
        amount: originalAmount,
        remaining_amount: remaining,
        loan_status: currentStatus,
      }

      // 🏆 Strict Guard: Only move to settled if remaining is 0
      if (remaining <= 0 || tx.loan_status === "settled") {
        settled.push(record)
      } else {
        active.push(record)
      }
    })

  const sortDesc = (a: ReceivableRecord, b: ReceivableRecord) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

  return {
    active: active.sort(sortDesc),
    settled: settled.sort(sortDesc),
  }
}

export async function getActiveReceivables(
  householdId: string,
  _cycleId?: string
): Promise<ReceivableRecord[]> {
  const { active } = await getReceivablesLedger(householdId)
  return active
}

// ── Payables ledger ───────────────────────────────────────────

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
    const isLoanPayable = tx.transaction_type === "loan_in"
    const isReimbursement = tx.transaction_type === "expense" && tx.paid_by === "other"
    if (!isLoanPayable && !isReimbursement) return

    const original = Number(tx.amount)
    const repaid = isLoanPayable ? (repaymentsMap.get(tx.id) ?? 0) : 0
    const remaining = isLoanPayable ? Math.max(0, original - repaid) : original

    let status = isLoanPayable ? tx.loan_status : tx.reimbursement_status
    if (isLoanPayable && remaining <= 0) status = "settled"

    const record: PayableRecord = {
      ...tx,
      amount: original,
      remaining_amount: remaining,
      transaction_type: tx.transaction_type as "loan_in" | "expense",
      loan_status: status as "pending" | "partial" | "settled" | null,
      reimbursement_status: tx.reimbursement_status as "pending" | "partial" | "settled" | null,
    }

    if (remaining <= 0 || status === "settled") {
      settled.push(record)
    } else {
      active.push(record)
    }
  })

  const sortDesc = (a: PayableRecord, b: PayableRecord) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

  return {
    active: active.sort(sortDesc),
    settled: settled.sort(sortDesc),
  }
}

export async function getActivePayables(
  householdId: string
): Promise<PayableRecord[]> {
  const { active } = await getPayablesLedger(householdId)
  return active
}