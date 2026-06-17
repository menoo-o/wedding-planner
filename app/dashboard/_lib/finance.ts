// app/dashboard/_lib/finance.ts

// ── Interfaces ────────────────────────────────────────────────

import {LifetimeDebtTransaction, CycleCalculationTransaction} from "@/lib/types"


export interface BalanceResult {
  cashBalance: number
  cardBalance: number
  currentExpenses: number
}

export interface DebtResult {
  receivables: number
  payables: number
}

// ── computeBalances ───────────────────────────────────────────
// No change needed here — balance movement is per-transaction
// and doesn't depend on whether a loan is partial or settled.

export function computeBalances(
  transactions: CycleCalculationTransaction[],
  openingBalance: number
): BalanceResult {
  let cashBalance = openingBalance
  let cardBalance = 0
  let currentExpenses = 0

  transactions.forEach((tx) => {
    const amt = tx.amount

    // Inflows
    if (
      tx.transaction_type === "top_up" ||
      tx.transaction_type === "loan_return" ||
      tx.transaction_type === "loan_in"
    ) {
      if (tx.payment_account === "cash") cashBalance += amt
      if (tx.payment_account === "card") cardBalance += amt
    }
    // Outflows
    else if (
      tx.transaction_type === "expense" ||
      tx.transaction_type === "settlement" ||
      tx.transaction_type === "loan_out"
    ) {
      // personal account = paid by someone else, doesn't touch house wallets
      if (tx.payment_account === "cash") cashBalance -= amt
      if (tx.payment_account === "card") cardBalance -= amt

      if (tx.transaction_type === "expense") currentExpenses += amt
    }
    // Internal vault transfer — direction encoded in description
    else if (tx.transaction_type === "transfer") {
      const sig = tx.description?.toLowerCase() ?? ""
      const isIn  = sig.includes("transfer in")
      const isOut = sig.includes("transfer out")

      if (tx.payment_account === "cash") {
        if (isIn)  cashBalance += amt
        if (isOut) cashBalance -= amt
      }
      if (tx.payment_account === "card") {
        if (isIn)  cardBalance += amt
        if (isOut) cardBalance -= amt
      }
    }
  })

  return { cashBalance, cardBalance, currentExpenses }
}

// ── computeLifetimeDebt ───────────────────────────────────────
// CHANGED: replaced binary "resolved IDs" Set with a repayments
// map so partial repayments are subtracted rather than zeroed out.
//
// Old approach: if a loan_return exists → exclude the loan entirely.
// New approach: sum all repayments against each loan → remaining = original - repaid.

export function computeLifetimeDebt(transactions: LifetimeDebtTransaction[]): DebtResult {
  // Build a map: original loan id → total amount repaid so far (across all partials)
  const repaymentsMap = new Map<string, number>()

  transactions.forEach((tx) => {
    if (
      (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") &&
      tx.related_transaction_id
    ) {
      const prev = repaymentsMap.get(tx.related_transaction_id) ?? 0
      repaymentsMap.set(tx.related_transaction_id, prev + tx.amount)
    }
  })

  // Accumulate remaining balances for each originating loan
  let receivables = 0
  let payables = 0

  transactions.forEach((tx) => {
    // Skip repayment rows themselves — only process the originating loans
    if (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") return
    // Skip anything the DB has already marked fully settled
    if (tx.loan_status === "settled") return

    const repaid    = repaymentsMap.get(tx.id) ?? 0
    const remaining = tx.amount - repaid

    if (remaining <= 0) return // fully covered by repayments even if DB hasn't updated yet

    if (tx.transaction_type === "loan_out") receivables += remaining
    if (tx.transaction_type === "loan_in")  payables   += remaining
  })

  return { receivables, payables }
}

// ── computeRunway ─────────────────────────────────────────────
// Unchanged — still falls back to prior-cycle burn if needed.

export function computeRunway(
  totalLiquidity: number,
  currentExpenses: number,
  previousExpenses: number
): number {
  const burn = currentExpenses > 0 ? currentExpenses : previousExpenses > 0 ? previousExpenses : 0
  return burn > 0 ? totalLiquidity / burn : Infinity
}

// ── computeDebtLoadRatio ──────────────────────────────────────

export function computeDebtLoadRatio(payables: number, totalLiquidity: number): number {
  if (totalLiquidity > 0) return (payables / totalLiquidity) * 100
  return payables > 0 ? 100 : 0
}