// app/dashboard/_lib/finance.ts

import { CycleCalculationTransaction, LifetimeDebtTransaction } from '@/lib/types'

export interface BalanceResult {
  cashBalance: number
  cardBalance: number
  currentExpenses: number
}

export interface DebtResult {
  receivables: number
  payables: number
}

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
      if (tx.payment_account === "cash") cashBalance -= amt
      if (tx.payment_account === "card") cardBalance -= amt

      if (tx.transaction_type === "expense") currentExpenses += amt
    }

    // Transfers
    else if (tx.transaction_type === "transfer") {
      const sig = tx.description ? tx.description.toLowerCase() : ""
      const isIn = sig.includes("transfer in")
      const isOut = sig.includes("transfer out")

      if (tx.payment_account === "cash") {
        if (isIn) cashBalance += amt
        if (isOut) cashBalance -= amt
      }
      if (tx.payment_account === "card") {
        if (isIn) cardBalance += amt
        if (isOut) cardBalance -= amt
      }
    }
  })

  return { cashBalance, cardBalance, currentExpenses }
}

export function computeLifetimeDebt(transactions: LifetimeDebtTransaction[]): DebtResult {
  const resolvedDebtIds = new Set<string>()

  // Pass 1: collect settled IDs
  transactions.forEach((tx) => {
    if (
      (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") &&
      tx.related_transaction_id
    ) {
      resolvedDebtIds.add(String(tx.related_transaction_id))
    }
  })

  // Pass 2: sum only active records
  let receivables = 0
  let payables = 0

  transactions.forEach((tx) => {
    if (!resolvedDebtIds.has(String(tx.id))) {
      if (tx.transaction_type === "loan_out") receivables += tx.amount
      if (tx.transaction_type === "loan_in") payables += tx.amount
    }
  })

  return { receivables, payables }
}

export function computeRunway(totalLiquidity: number, currentExpenses: number, previousExpenses: number): number {
  const burn = currentExpenses > 0 ? currentExpenses : previousExpenses > 0 ? previousExpenses : 0
  return burn > 0 ? totalLiquidity / burn : Infinity
}

export function computeDebtLoadRatio(payables: number, totalLiquidity: number): number {
  if (totalLiquidity > 0) return (payables / totalLiquidity) * 100
  return payables > 0 ? 100 : 0
}
