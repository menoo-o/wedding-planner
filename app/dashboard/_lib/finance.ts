// app/dashboard/_lib/finance.ts

import { 
  LifetimeDebtTransaction, 
  CycleCalculationTransaction, 
  ReceivableRecord,
  LoanStatus 
} from "@/lib/types";

// ── Interfaces ────────────────────────────────────────────────

export interface BalanceResult {
  cashBalance: number;
  cardBalance: number;
  currentExpenses: number;
}

export interface DebtResult {
  receivables: number;
  payables: number;
}

// ── computeBalances ───────────────────────────────────────────

export function computeBalances(
  transactions: CycleCalculationTransaction[],
  openingBalance: number
): BalanceResult {
  let cashBalance = openingBalance;
  let cardBalance = 0;
  let currentExpenses = 0;

  for (const tx of transactions) {
    const amt = tx.amount;

    // Inflows
    if (["top_up", "loan_return", "loan_in"].includes(tx.transaction_type)) {
      if (tx.payment_account === "cash") cashBalance += amt;
      if (tx.payment_account === "card") cardBalance += amt;
    }
    // Outflows
    else if (["expense", "settlement", "loan_out"].includes(tx.transaction_type)) {
      if (tx.payment_account === "cash") cashBalance -= amt;
      if (tx.payment_account === "card") cardBalance -= amt;
      if (tx.transaction_type === "expense") currentExpenses += amt;
    }
    // Internal vault transfer
    else if (tx.transaction_type === "transfer") {
      const sig = tx.description?.toLowerCase() ?? "";
      const isIn = sig.includes("transfer in");
      const isOut = sig.includes("transfer out");

      if (tx.payment_account === "cash") {
        cashBalance += isIn ? amt : isOut ? -amt : 0;
      }
      if (tx.payment_account === "card") {
        cardBalance += isIn ? amt : isOut ? -amt : 0;
      }
    }
  }

  return { cashBalance, cardBalance, currentExpenses };
}

// ── computeLifetimeDebt ───────────────────────────────────────

export function computeLifetimeDebt(
  transactions: LifetimeDebtTransaction[]
): DebtResult {
  // 1. Inlined single-pass map for repayments
  const repaymentsMap = new Map<string, number>();
  for (const tx of transactions) {
    if (
      tx.related_transaction_id &&
      (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement")
    ) {
      const current = repaymentsMap.get(tx.related_transaction_id) || 0;
      repaymentsMap.set(tx.related_transaction_id, current + Number(tx.amount));
    }
  }

  let receivables = 0;
  let payables = 0;

  // 2. Compute outstanding active debts
  for (const tx of transactions) {
    if (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") continue;
    if (tx.loan_status === "settled") continue;

    const repaid = repaymentsMap.get(tx.id) ?? 0;
    const remaining = Math.max(0, Number(tx.amount) - repaid);

    if (remaining <= 0) continue;

    if (tx.transaction_type === "loan_out") receivables += remaining;
    if (tx.transaction_type === "loan_in") payables += remaining;
  }

  return { receivables, payables };
}

// ── computeRunway ─────────────────────────────────────────────

export function computeRunway(
  totalLiquidity: number,
  currentExpenses: number,
  previousExpenses: number
): number {
  const burn = currentExpenses > 0 
    ? currentExpenses 
    : previousExpenses > 0 
      ? previousExpenses 
      : 0;
  return burn > 0 ? totalLiquidity / burn : Infinity;
}

// ── computeDebtLoadRatio ──────────────────────────────────────

export function computeDebtLoadRatio(
  payables: number, 
  totalLiquidity: number
): number {
  if (totalLiquidity > 0) return (payables / totalLiquidity) * 100;
  return payables > 0 ? 100 : 0;
}

// app/dashboard/_lib/finance.ts
// Moved out of _db/ — this is now pure computation (same category as
// computeBalances), not I/O. It takes the cycle + transactions the caller
// already fetched instead of re-querying Supabase for rows that were
// already pulled in getDashboardData's Stage 3 batch.

// app/dashboard/_lib/finance.ts
type CycleRow = {
  id: string
  opening_cash_balance: string | number | null | undefined
  opening_bank_balance: string | number | null | undefined
}

type LiquidityTransaction = {
  amount: string | number | null
  payment_account: string | null
  transaction_type: string
  description: string | null
}

export function computeLiveLiquidity(
  cycle: CycleRow | null,
  transactions: LiquidityTransaction[]
) {
  if (!cycle) {
    return { cash: 0, card: 0, total: 0, monthlyExpenses: 0, cycleId: null }
  }

  const openingCash = parseFloat(String(cycle.opening_cash_balance ?? "0"))
  const openingBank = parseFloat(String(cycle.opening_bank_balance ?? "0"))

  let cashChange = 0
  let bankChange = 0
  let accumulatedExpenses = 0

  transactions.forEach((tx) => {
    const val = parseFloat(String(tx.amount ?? "0"))
    const isAddition = ["top_up", "loan_return", "loan_in"].includes(tx.transaction_type)
    const isDeduction = ["expense", "settlement", "loan_out"].includes(tx.transaction_type)

    const isPaidExpense = tx.transaction_type === "expense" && tx.payment_account !== null
    const isPendingVendorExpense = tx.transaction_type === "expense" && tx.payment_account === null

    if (isPaidExpense || isPendingVendorExpense) {
      accumulatedExpenses += val
    }

    // Cash interactions
    if (tx.payment_account === "cash") {
      if (isAddition) cashChange += val
      if (isDeduction) cashChange -= val
      if (tx.transaction_type === "transfer") {
        if (tx.description?.startsWith("Transfer in")) cashChange += val
        if (tx.description?.startsWith("Transfer out")) cashChange -= val
      }
    }
    // Bank Card interactions
    else if (tx.payment_account === "card") {
      if (isAddition) bankChange += val
      if (isDeduction) bankChange -= val
      if (tx.transaction_type === "transfer") {
        if (tx.description?.startsWith("Transfer in")) bankChange += val
        if (tx.description?.startsWith("Transfer out")) bankChange -= val
      }
    }
  })

  const finalCash = openingCash + cashChange
  const finalBank = openingBank + bankChange

  return {
    cash: finalCash,
    card: finalBank,
    total: finalCash + finalBank,
    monthlyExpenses: accumulatedExpenses,
    cycleId: cycle.id,
  }
}