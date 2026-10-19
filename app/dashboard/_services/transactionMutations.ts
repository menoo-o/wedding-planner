// app/dashboard/_services/transactionMutations.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export async function softDeleteTransactionAction(transactionId: string) {
  const supabase = await createClient()

  // Sets deleted_at; DB trigger verifies if cycle is still open
  const { error } = await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", transactionId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/debts")
  return { success: true }
}

export async function updateTransactionAction(
  transactionId: string,
  payload: {
    amount: number
    description?: string | null
    payment_account: "cash" | "card"
    category_id?: string | null
    notes?: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("transactions")
    .update({
      amount: payload.amount,
      description: payload.description?.trim() || null,
      payment_account: payload.payment_account,
      category_id: payload.category_id || null,
      notes: payload.notes?.trim() || null,
      updated_at: new Date().toISOString(), //
    })
    .eq("id", transactionId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/debts")
  return { success: true }
}