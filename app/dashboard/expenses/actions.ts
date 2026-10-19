// app/dashboard/expenses/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export async function softDeleteExpenseAction(transactionId: string) {
  const supabase = await createClient()

  // 1. Check user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Set deleted_at (DB trigger guard_transaction_mutation will reject if cycle is closed)[cite: 15]
  const { error } = await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() }) //[cite: 15]
    .eq("id", transactionId)

  if (error) {
    throw new Error(error.message)
  }

  // 3. Revalidate dashboard & expense paths
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/expenses") //
  return { success: true }
}

export async function updateExpenseAction({
  transactionId,
  description,
  amount,
  categoryId,
  paymentAccount,
  notes,
}: {
  transactionId: string
  description: string
  amount: number
  categoryId: string
  paymentAccount: "cash" | "card"
  notes?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const cleanAmount = Math.round(Number(amount) * 100) / 100
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    throw new Error("Amount must be greater than 0")
  }

  // DB trigger updates version and updated_at automatically[cite: 15]
  const { error } = await supabase
    .from("transactions")
    .update({
      description: description.trim(),
      amount: cleanAmount,
      category_id: categoryId,
      payment_account: paymentAccount,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(), //[cite: 15]
    })
    .eq("id", transactionId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/expenses") //
  return { success: true }
}