// types.ts — CLEANED UP

// Remove this backward import:
// import { PayableRecord } from "@/app/dashboard/components/Payables";  ← DELETE

// ── Todo (unrelated, keep as-is) ──────────────────────────────
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  genre_id: string | null;
  created_at: string;
  optimistic?: boolean;
}

// ── Auth ──────────────────────────────────────────────────────
export type LoginState = {
  error: string | null;
  issues: Record<string, string[]>;
};

export const initialLoginState: LoginState = {
  error: null,
  issues: {},
};

// ── Household ─────────────────────────────────────────────────
export type HouseholdMember = {
  household_id: string;
  role: "admin" | string;
  status: "active" | "inactive" | "pending" | string;
  user_id: string;
};

// lib/types.ts
export interface MonthlyCycle {
  id: string
  household_id: string
  created_at: string
  is_closed: boolean
  month: number
  year: number
  opening_balance: number
  opening_cash_balance?: number
  opening_bank_balance?: number
  days_in_cycle?: number
}
// ── Category ─────────────────────────────────────────────────
export type Category = {
  id: string;
  household_id: string;
  name: string;
};

// ── Transaction Types ─────────────────────────────────────────

// Base transaction (shared fields)
export interface BaseTransaction {
  id: string;
  household_id: string;
  cycle_id: string;
  amount: number;
  transaction_type: string;
  related_transaction_id: string | null;
}

// For cycle-scoped calculations (dashboard current month)
export interface CycleCalculationTransaction extends BaseTransaction {
  transaction_type:
    | "top_up" | "expense" | "transfer"
    | "loan_in" | "loan_out" | "loan_return"
    | "settlement" | "refund" | "adjustment";
  payment_account: "cash" | "card" | "personal";
  description: string;
  category_id?: string | null;
  paid_by?: "household" | "someone_else";
  loan_status: "pending" | "partial" | "settled" | null;
  counterparty_name?: string | null;
  created_at?: string | null;
  notes?: string | null;
  reimbursement_status?: string | null;
}
// For lifetime debt calculations (all cycles)
export interface LifetimeDebtTransaction extends BaseTransaction {
  transaction_type: "loan_in" | "loan_out" | "loan_return" | "settlement";
  loan_status?: "pending" | "partial" | "settled" | null;
}

// ── Ledger Records ────────────────────────────────────────────

export type LoanStatus = "pending" | "partial" | "settled";

// export type ReceivableRecord = {
//   id: string;
//   amount: number;
//   remaining_amount: number;
//   loan_status: LoanStatus;
//   transaction_type: string;
//   payment_account: "cash" | "card" | "personal";
//   counterparty_name: string | null;
//   description: string | null;
//   created_at: string;
//   notes: string | null;
//   related_transaction_id: string | null;
// };

// export type PayableRecord = {
//   id: string;
//   amount: number;
//   remaining_amount: number;
//   transaction_type: "loan_in" | "expense";
//   loan_status: LoanStatus | null;
//   reimbursement_status: LoanStatus | null;
//   household_id: string;
//   cycle_id: string;
//   counterparty_name: string | null;
//   description: string | null;
//   created_at: string;
//   related_transaction_id: string | null;
// };

// ── Dashboard Data ───────────────────────────────────────────
export interface DashboardData {
  householdMember: HouseholdMember | null;
  userId: string | null;
  monthlyCycle: MonthlyCycle | null;
  categories: Category[];
  cash: number;
  card: number;
  total: number;
  savingsBalance: number;
  walletName: string | null;
  overallLiquidity: number;
  receivables: number;
  payables: number;
  netDebt: number;
  currentExpenses: number;
  previousExpenses: number;
  runway: number;
  debtLoadRatio: number;
  rawTransactions: CycleCalculationTransaction[];
  payablesRecords: PayableRecord[];
  receivablesRecords: ReceivableRecord[];
}

// export type LoanStatus = "pending" | "partial" | "settled"
export type PaymentAccount = "cash" | "card" | "personal"
export type PaidBy = "household" | "someone_else"

// Global system transaction types
export type TransactionType =
  | "expense"
  | "top_up"
  | "loan_in"
  | "loan_out"
  | "loan_return"
  | "settlement"
  | "transfer"
  | "adjustment"
  | "refund"

// Strict representation of what Postgres returns from the transactions table
export interface TransactionDbRow {
  id: string
  household_id: string
  cycle_id: string
  transaction_type: TransactionType
  amount: number
  counterparty_name: string | null
  paid_by: PaidBy | null
  payment_account: PaymentAccount | null
  loan_status: LoanStatus | null
  reimbursement_status: LoanStatus | null
  related_transaction_id: string | null
  created_at: string
  description: string | null
  notes: string | null
}

export interface ReceivableRecord {
  id: string
  household_id: string
  cycle_id: string
  amount: number
  settled_amount: number
  remaining_amount: number
  loan_status: LoanStatus
  transaction_type: "loan_out"
  payment_account: PaymentAccount | null
  counterparty_name: string | null
  description: string | null
  created_at: string
  notes: string | null
  related_transaction_id: string | null
  is_settled: boolean
}

export interface PayableRecord {
  id: string
  household_id: string
  cycle_id: string
  amount: number
  settled_amount: number
  remaining_amount: number
  transaction_type: "loan_in" | "expense"
  loan_status: LoanStatus | null
  reimbursement_status: LoanStatus | null
  payment_account: PaymentAccount | null
  paid_by: PaidBy | null
  counterparty_name: string | null
  description: string | null
  created_at: string
  notes: string | null
  related_transaction_id: string | null
  is_settled: boolean
}

export interface CombinedDebtLedger {
  receivables: ReceivableRecord[]
  payables: PayableRecord[]
  totalReceivable: number
  totalPayable: number
}

export interface PaginatedDebtHistory {
  history: Array<ReceivableRecord | PayableRecord>
  totalRecords: number
  totalPages: number
  currentPage: number
}
