// app/dashboard/_services/recordRepayment.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

interface RecordRepaymentParams {
  parentDebtId: string
  amount: number
  paymentAccount: "cash" | "card"
  notes?: string | null
}

export async function recordRepaymentAction({
  parentDebtId,
  amount,
  paymentAccount,
  notes,
}: RecordRepaymentParams) {
  const supabase = await createClient()

  // 1. Fetch parent obligation row
  const { data: parent, error: fetchErr } = await supabase
    .from("transactions")
    .select(`
      id,
      household_id,
      cycle_id,
      created_by,
      amount,
      transaction_type,
      counterparty_name,
      loan_status,
      reimbursement_status
    `)
    .eq("id", parentDebtId)
    .single()

  if (fetchErr || !parent) {
    throw new Error(fetchErr?.message || "Original debt transaction not found.")
  }

  // 2. Fetch existing repayments to calculate current remaining balance
  const { data: existingChildren, error: childErr } = await supabase
    .from("transactions")
    .select("amount")
    .eq("related_transaction_id", parentDebtId)
    .in("transaction_type", ["loan_return", "settlement"])

  if (childErr) {
    throw new Error(childErr.message)
  }

  const alreadyPaid = (existingChildren ?? []).reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  )
  const originalAmount = Number(parent.amount) || 0
  const currentRemaining = Math.max(0, originalAmount - alreadyPaid)

  // Guard against invalid or excessive payments
  const cleanRepayAmount = Math.round(Number(amount) * 100) / 100
  if (isNaN(cleanRepayAmount) || cleanRepayAmount <= 0) {
    throw new Error("Payment amount must be greater than 0.")
  }
  if (cleanRepayAmount > currentRemaining + 0.009) {
    throw new Error(`Repayment exceeds remaining balance of Rs ${currentRemaining}.`)
  }

  const nextRemaining = Math.max(0, currentRemaining - cleanRepayAmount)
  const isSettled = nextRemaining <= 0.001
  const childTransactionType = isSettled ? "settlement" : "loan_return"
  const nowIso = new Date().toISOString()

  // 3. Insert child repayment transaction
  const { error: insertErr } = await supabase.from("transactions").insert({
    household_id: parent.household_id,
    cycle_id: parent.cycle_id,
    created_by: parent.created_by,
    transaction_type: childTransactionType,
    counterparty_name: parent.counterparty_name,
    amount: cleanRepayAmount,
    payment_account: paymentAccount,
    related_transaction_id: parent.id,
    notes: notes?.trim() || null,
    created_at: nowIso,
    cleared_at: isSettled ? nowIso : null,
  })

  if (insertErr) {
    throw new Error(`Failed to record repayment: ${insertErr.message}`)
  }

  // 4. Update parent obligation status
  const updatedStatus = isSettled ? "settled" : "partial"
  const isExpenseReimbursement = parent.transaction_type === "expense"

  const parentPatch: Record<string, string | null> = isExpenseReimbursement
    ? { reimbursement_status: updatedStatus }
    : { loan_status: updatedStatus }

  if (isSettled) {
    parentPatch.cleared_at = nowIso
  }

  const { error: updateErr } = await supabase
    .from("transactions")
    .update(parentPatch)
    .eq("id", parent.id)

  if (updateErr) {
    console.error("Warning: Child recorded but parent status update failed:", updateErr.message)
  }

  // 5. Revalidate cache
  revalidatePath("/dashboard/debts")
  return { success: true, isSettled, nextRemaining }
}