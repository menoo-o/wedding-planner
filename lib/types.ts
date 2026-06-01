// types/todo.ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
   genre_id: string | null;  
  created_at: string;
  optimistic?: boolean;
}

// //LOGIN PAGE

export type LoginState = {
  error: string | null;
  issues: Record<string, string[]>;
};

export const initialLoginState: LoginState = {
  error: null,
  issues: {},
};



// DASHBOARD PAGE

export type HouseholdMember = {
  household_id: string
  role: "admin" | string
  status: "active" | "inactive" | "pending" | string
  user_id: string
}


export type MonthlyCycle = {
  id: string
  household_id?: string
  month?: number
  year?: number
  is_closed?: boolean
  opening_balance?: number
  closing_balance?: number
  created_at?: string
}

// Catefory Table: [id, household_id, name]
export type Category = {
  id: string
  household_id: string
  name: string
}

export interface CycleCalculationTransaction {
  id: string
  amount: number
  transaction_type: "top_up" | "expense" | "transfer" | "loan_in" | "loan_out" | "loan_return" | "settlement" | "refund" | "adjustment"
  payment_account: "cash" | "card"
  description: string
  related_transaction_id: string | null
  category_id: string | null
  created_at: string | null
}
 
export interface LifetimeDebtTransaction {
  id: string
  amount: number
  transaction_type: "loan_in" | "loan_out" | "loan_return" | "settlement"
  related_transaction_id: string | null
}
 
export interface DashboardData {
  householdMember: HouseholdMember | null
  monthlyCycle: MonthlyCycle | null
  categories: Category[]
  cash: number
  card: number
  total: number
  receivables: number
  payables: number
  netDebt: number
  currentExpenses: number
  previousExpenses: number
  runway: number
  debtLoadRatio: number
  rawTransactions: CycleCalculationTransaction[]
}