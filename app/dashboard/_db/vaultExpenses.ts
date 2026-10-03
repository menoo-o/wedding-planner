// app/dashboard/_db/vaultExpenses.ts

export type VaultExpenseCategory =
  | "education"
  | "medical"
  | "legal"
  | "home_repair"
  | "other"

export type VaultExpenseStatus = "planned" | "paid" | "cancelled"
export type VaultExpenseRecurrence = "one_time" | "semester" | "annual" | "custom"

export interface VaultExpenseRow {
  id: string
  household_id: string
  created_by: string
  title: string
  payee_name: string | null
  category: VaultExpenseCategory
  amount: number
  vault_balance_after: number
  status: VaultExpenseStatus
  due_date: string | null
  paid_at: string | null
  recurrence: VaultExpenseRecurrence
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultExpensesSummary {
  plannedTotal: number
  paidTotalThisYear: number
  items: VaultExpenseRow[]
}