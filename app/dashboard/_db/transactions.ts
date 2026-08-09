// app/dashboard/_db/transactions.ts

import { createClient } from '@/utils/supabase/server';
import { 
  CycleCalculationTransaction, 
  ReceivableRecord, 
  PayableRecord,
  LoanStatus 
} from '@/lib/types';
import { 
  buildRepaymentsMap, 
  calcRemaining, 
  resolveStatus, 
  sortByDateDesc,
  buildReceivableRecord,
  buildPayableRecord 
} from '../_lib/ledger';

// ── getCycleTransactions ──────────────────────────────────────

export async function getCycleTransactions(
  householdId: string,
  cycleId: string
): Promise<CycleCalculationTransaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id, amount, transaction_type, payment_account, description, 
      related_transaction_id, category_id, created_at, notes, 
      loan_status, reimbursement_status, paid_by, counterparty_name
    `)
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch cycle transactions:", error);
    return [];
  }

  return data as CycleCalculationTransaction[];
}

// ── getPrevCycleExpenses ──────────────────────────────────────

export async function getPrevCycleExpenses(
  householdId: string,
  cycleId: string
): Promise<{ amount: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .eq("transaction_type", "expense");

  if (error || !data) {
    console.error("Failed to fetch previous cycle expenses:", error);
    return [];
  }

  return data;
}

// ── getTransactionsByType ─────────────────────────────────────
// NEW: Reusable for future expense/debt pages
export async function getTransactionsByType(
  householdId: string,
  types: string[],
  options?: {
    cycleId?: string;
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
  }
) {
  const supabase = await createClient();
  
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("household_id", householdId)
    .in("transaction_type", types);

  if (options?.cycleId) query = query.eq("cycle_id", options.cycleId);
  if (options?.limit) query = query.limit(options.limit);
  
  const orderColumn = options?.orderBy || "created_at";
  query = query.order(orderColumn, { 
    ascending: options?.ascending ?? false 
  });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ── Receivables Ledger (ALL cycles) ──────────────────────────

export async function getReceivablesLedger(
  householdId: string,
  _cycleId?: string // Reserved for future cycle-scoped filtering
): Promise<{ active: ReceivableRecord[]; settled: ReceivableRecord[] }> {
  const supabase = await createClient();

  const { data: records, error } = await supabase
    .from("transactions")
    .select(`
      id, amount, transaction_type, payment_account, counterparty_name, 
      description, created_at, notes, related_transaction_id, loan_status
    `)
    .eq("household_id", householdId)
    .in("transaction_type", ["loan_out", "loan_return"]);

  if (error || !records) {
    console.error("Failed to pull receivables ledger:", error?.message);
    return { active: [], settled: [] };
  }

  const repaymentsMap = buildRepaymentsMap(records);

  const active: ReceivableRecord[] = [];
  const settled: ReceivableRecord[] = [];

  for (const tx of records) {
    if (tx.transaction_type !== "loan_out") continue;
    
    const record = buildReceivableRecord(tx, repaymentsMap);
    const isSettled = record.loan_status === "settled" || record.remaining_amount <= 0;
    
    (isSettled ? settled : active).push(record);
  }

  return {
    active: active.sort(sortByDateDesc),
    settled: settled.sort(sortByDateDesc),
  };
}

export async function getActiveReceivables(
  householdId: string,
  cycleId?: string
): Promise<ReceivableRecord[]> {
  const { active } = await getReceivablesLedger(householdId, cycleId);
  return active;
}

// ── Payables Ledger (ALL cycles) ─────────────────────────────

export async function getPayablesLedger(
  householdId: string,
  _cycleId?: string 
  // Reserved for future cycle-scoped filtering
): Promise<{ active: PayableRecord[]; settled: PayableRecord[] }> {
  const supabase = await createClient();

  const { data: records, error } = await supabase
    .from("transactions")
    .select(`
      id, amount, transaction_type, household_id, cycle_id, 
      counterparty_name, description, created_at, related_transaction_id, 
      reimbursement_status, loan_status, paid_by
    `)
    .eq("household_id", householdId)
    .in("transaction_type", ["loan_in", "loan_return", "settlement", "expense"]);

  if (error || !records) {
    console.error("Failed to pull payables ledger:", error?.message);
    return { active: [], settled: [] };
  }

  const repaymentsMap = buildRepaymentsMap(records);

  const active: PayableRecord[] = [];
  const settled: PayableRecord[] = [];

  for (const tx of records) {
    const isLoanPayable = tx.transaction_type === "loan_in";
    const isReimbursement = tx.transaction_type === "expense" && tx.paid_by === "someone_else"
    
    if (!isLoanPayable && !isReimbursement) continue;

    const record = buildPayableRecord(tx, repaymentsMap, isLoanPayable);
    const isSettled = record.remaining_amount <= 0 || record.loan_status === "settled";
    
    (isSettled ? settled : active).push(record);
  }

  return {
    active: active.sort(sortByDateDesc),
    settled: settled.sort(sortByDateDesc),
  };
}

export async function getActivePayables(
  householdId: string,
  cycleId?: string
): Promise<PayableRecord[]> {
  const { active } = await getPayablesLedger(householdId, cycleId);
  return active;
}