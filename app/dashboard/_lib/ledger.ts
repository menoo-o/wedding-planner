// app/dashboard/_lib/ledger.ts

import { ReceivableRecord, PayableRecord } from "@/lib/types";

// ── Shared repayment map builder ──────────────────────────────

export interface Repayable {
  id: string;
  amount: number;
  transaction_type: string;
  related_transaction_id: string | null;
}

export function buildRepaymentsMap(records: Repayable[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of records) {
    if (
      (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") &&
      tx.related_transaction_id
    ) {
      const prev = map.get(tx.related_transaction_id) ?? 0;
      map.set(tx.related_transaction_id, prev + Number(tx.amount));
    }
  }
  return map;
}

export function calcRemaining(original: number, repaid: number): number {
  return Math.max(0, original - repaid);
}

export function resolveStatus(
  remaining: number,
  repaid: number,
  dbStatus: string | null
): "pending" | "partial" | "settled" {
  if (remaining <= 0) return "settled";
  if (repaid > 0) return "partial";
  return (dbStatus as "pending" | "partial" | "settled") || "pending";
}

export const sortByDateDesc = <T extends { created_at: string }>(a: T, b: T) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

// ── Receivable record builder ─────────────────────────────────

export function buildReceivableRecord(
  tx: Repayable & {
    payment_account?: string;
    counterparty_name?: string | null;
    description?: string | null;
    created_at?: string;
    notes?: string | null;
  },
  repaymentsMap: Map<string, number>
): ReceivableRecord {
  const original = Number(tx.amount);
  const repaid = repaymentsMap.get(tx.id) ?? 0;
  const remaining = calcRemaining(original, repaid);

  return {
    id: tx.id,
    amount: original,
    remaining_amount: remaining,
    loan_status: resolveStatus(remaining, repaid, (tx as any).loan_status ?? null),
    transaction_type: tx.transaction_type,
    payment_account: ((tx as any).payment_account as "cash" | "card" | "personal") || "cash",
    counterparty_name: (tx as any).counterparty_name ?? null,
    description: (tx as any).description ?? null,
    created_at: (tx as any).created_at ?? new Date().toISOString(),
    notes: (tx as any).notes ?? null,
    related_transaction_id: tx.related_transaction_id,
  };
}

// ── Payable record builder ────────────────────────────────────

export function buildPayableRecord(
  tx: Repayable & {
    household_id?: string;
    cycle_id?: string;
    counterparty_name?: string | null;
    description?: string | null;
    created_at?: string;
    paid_by?: string;
    reimbursement_status?: string | null;
    loan_status?: string | null;
  },
  repaymentsMap: Map<string, number>,
  isLoanPayable: boolean
): PayableRecord {
  const original = Number(tx.amount);
  const repaid = isLoanPayable ? (repaymentsMap.get(tx.id) ?? 0) : 0;
  const remaining = isLoanPayable ? calcRemaining(original, repaid) : original;

  let status = isLoanPayable
    ? tx.loan_status
    : tx.reimbursement_status;
  
  if (isLoanPayable && remaining <= 0) status = "settled";

  return {
    id: tx.id,
    amount: original,
    remaining_amount: remaining,
    transaction_type: (tx.transaction_type as "loan_in" | "expense") || "expense",
    loan_status: (status as "pending" | "partial" | "settled" | null) || null,
    reimbursement_status: (tx.reimbursement_status as "pending" | "partial" | "settled" | null) || null,
    household_id: (tx as any).household_id || "",
    cycle_id: (tx as any).cycle_id || "",
    counterparty_name: (tx as any).counterparty_name ?? null,
    description: (tx as any).description ?? null,
    created_at: (tx as any).created_at ?? new Date().toISOString(),
    related_transaction_id: tx.related_transaction_id,
  };
}