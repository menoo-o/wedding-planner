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

export type MonthlyCycle = {
  id: string;
  household_id?: string;
  month?: number;
  year?: number;
  is_closed?: boolean;
  opening_balance?: number;
  closing_balance?: number;
  created_at?: string;
};

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
  paid_by?: "household" | "someone_else"
  loan_status: "pending" | "partial" | "settled" | null;
  counterparty_name?: string | null;
  created_at?: string | null;
  notes?: string | null;
}

// For lifetime debt calculations (all cycles)
export interface LifetimeDebtTransaction extends BaseTransaction {
  transaction_type: "loan_in" | "loan_out" | "loan_return" | "settlement";
  loan_status?: "pending" | "partial" | "settled" | null;
}

// ── Ledger Records ────────────────────────────────────────────

export type LoanStatus = "pending" | "partial" | "settled";

export type ReceivableRecord = {
  id: string;
  amount: number;
  remaining_amount: number;
  loan_status: LoanStatus;
  transaction_type: string;
  payment_account: "cash" | "card" | "personal";
  counterparty_name: string | null;
  description: string | null;
  created_at: string;
  notes: string | null;
  related_transaction_id: string | null;
};

export type PayableRecord = {
  id: string;
  amount: number;
  remaining_amount: number;
  transaction_type: "loan_in" | "expense";
  loan_status: LoanStatus | null;
  reimbursement_status: LoanStatus | null;
  household_id: string;
  cycle_id: string;
  counterparty_name: string | null;
  description: string | null;
  created_at: string;
  related_transaction_id: string | null;
};

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