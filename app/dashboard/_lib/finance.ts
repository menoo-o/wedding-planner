// app/dashboard/_lib/finance.ts

import { 
  LifetimeDebtTransaction, 
  CycleCalculationTransaction, 
  ReceivableRecord,
  LoanStatus 
} from "@/lib/types";
import { buildRepaymentsMap, calcRemaining } from "./ledger";

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
  const repaymentsMap = buildRepaymentsMap(transactions);

  let receivables = 0;
  let payables = 0;

  for (const tx of transactions) {
    // Skip repayments and settled loans
    if (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") continue;
    if (tx.loan_status === "settled") continue;

    const repaid = repaymentsMap.get(tx.id) ?? 0;
    const remaining = tx.amount - repaid;

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

// ── deriveReceivablesLedger ───────────────────────────────────
// DEPRECATED: Use getReceivablesLedger() from _db/transactions.ts instead
// Kept for backward compat if any other code uses it, but marked deprecated

/**
 * @deprecated Use getReceivablesLedger() from _db/transactions.ts for cross-cycle data
 */
export function deriveReceivablesLedger(
  currentTxs: CycleCalculationTransaction[]
): { active: ReceivableRecord[]; settled: ReceivableRecord[] } {
  const records = currentTxs.filter((tx) =>
    tx.transaction_type === "loan_out" || tx.transaction_type === "loan_return"
  );

  const repaymentsMap = buildRepaymentsMap(records);
  const active: ReceivableRecord[] = [];
  const settled: ReceivableRecord[] = [];

  for (const tx of records) {
    if (tx.transaction_type !== "loan_out") continue;

    const repaid = repaymentsMap.get(tx.id) ?? 0;
    const remaining = calcRemaining(Number(tx.amount), repaid);

    const record: ReceivableRecord = {
      id: tx.id,
      amount: Number(tx.amount),
      remaining_amount: remaining,
      loan_status: (tx.loan_status as LoanStatus) || "pending",
      transaction_type: tx.transaction_type,
      payment_account: tx.payment_account,
      counterparty_name: tx.counterparty_name ?? null,
      description: tx.description,
      created_at: tx.created_at ?? "",
      notes: tx.notes ?? null,
      related_transaction_id: tx.related_transaction_id,
    };

    const isSettled = tx.loan_status === "settled" || remaining <= 0;
    (isSettled ? settled : active).push(record);
  }

  const sortDesc = (a: ReceivableRecord, b: ReceivableRecord) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  return { 
    active: active.sort(sortDesc), 
    settled: settled.sort(sortDesc) 
  };
}