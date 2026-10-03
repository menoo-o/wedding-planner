// app/dashboard/_services/recordVaultExpense.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import type {
  VaultExpenseCategory,
  VaultExpenseStatus,
  VaultExpenseRecurrence,
} from "@/app/dashboard/_db/vaultExpenses"

interface RecordVaultExpenseParams {
  householdId: string
  title: string
  payeeName?: string | null
  category: VaultExpenseCategory
  amount: number
  status: VaultExpenseStatus
  dueDate?: string | null
  recurrence?: VaultExpenseRecurrence
  notes?: string | null
}

export async function recordVaultExpenseAction(params: RecordVaultExpenseParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const cleanAmount = Math.round(Number(params.amount) * 100) / 100
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    throw new Error("Amount must be greater than 0.")
  }

  // 1. Fetch current savings_balance from households table
  const { data: household, error: fetchErr } = await supabase
    .from("households")
    .select("id, savings_balance")
    .eq("id", params.householdId)
    .single()

  if (fetchErr || !household) {
    throw new Error("Household record not found.")
  }

  const currentVaultBalance = Number(household.savings_balance) || 0

  // 2. Validate balance if marking as paid
  let nextVaultBalance = currentVaultBalance
  if (params.status === "paid") {
    if (cleanAmount > currentVaultBalance) {
      throw new Error(
        `Insufficient vault balance. Available: Rs ${currentVaultBalance.toLocaleString()}`
      )
    }
    nextVaultBalance = currentVaultBalance - cleanAmount
  }

  const nowIso = new Date().toISOString()

  // 3. Insert into vault_expenses
  const { data: record, error: insertError } = await supabase
    .from("vault_expenses")
    .insert({
      household_id: params.householdId,
      created_by: user.id,
      title: params.title.trim(),
      payee_name: params.payeeName?.trim() || null,
      category: params.category,
      amount: cleanAmount,
      vault_balance_after: nextVaultBalance,
      status: params.status,
      due_date: params.dueDate || null,
      paid_at: params.status === "paid" ? nowIso : null,
      recurrence: params.recurrence || "one_time",
      notes: params.notes?.trim() || null,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to log vault expense: ${insertError.message}`)
  }

  // 4. Update savings_balance on households table
  if (params.status === "paid") {
    const { error: updateError } = await supabase
      .from("households")
      .update({ savings_balance: nextVaultBalance })
      .eq("id", params.householdId)

    if (updateError) {
      console.error("Warning: Expense logged but household balance update failed:", updateError.message)
    }
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/savings")
  revalidatePath("/dashboard/savings/emergency-spend")

  return { success: true, record }
}