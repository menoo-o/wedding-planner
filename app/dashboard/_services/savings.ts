"use server"

import { createClient } from "@/utils/supabase/server"

/**
 * Phase 2, Part 1: Initialize the single allowable household savings wallet
 */
export async function initializeSavingsWallet(householdId: string, walletName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("households")
    .update({ 
      savings_wallet_name: walletName.trim(),
      savings_balance: 0.00 
    })
    .eq("id", householdId)
    .select("id, savings_wallet_name, savings_balance")
    .single()

  if (error) {
    throw new Error(`Failed to provision savings workspace: ${error.message}`)
  }

  // 🚀 FIXED: Mapping explicitly to a plain object to prevent serializing prototype errors
  return {
    id: String(data.id),
    savings_wallet_name: String(data.savings_wallet_name),
    savings_balance: Number(data.savings_balance || 0)
  };
}

/**
 * Phase 2, Part 2: Execute an insulated savings transfer
 * Handles math updates to the household table and appends a clear transaction history row.
 */
export async function executeSavingsTransfer({
  householdId,
  cycleId,
  userId,
  direction, // "in" (to savings) or "out" (back to spending)
  sourceAccount, // "cash" or "card"
  amount
}: {
  householdId: string
  cycleId: string
  userId: string
  direction: "in" | "out"
  sourceAccount: "cash" | "card"
  amount: number
}) {
  const supabase = await createClient()
  const numericAmount = Number(amount)

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid transfer amount requested.")
  }

  // 1. Fetch current balances to guarantee safe transaction processing
  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("savings_balance, savings_wallet_name")
    .eq("id", householdId)
    .single()

  if (householdError || !household) {
    throw new Error("Could not verify household configuration.")
  }

  const currentSavings = Number(household.savings_balance || 0)
  const walletName = household.savings_wallet_name || "Savings"

  let nextSavingsBalance = currentSavings
  let transactionDescription = ""

  // 2. Perform Account Allocation Logic
  if (direction === "in") {
    // Moving from standard liquidity (Cash/Card) INTO Savings
    nextSavingsBalance += numericAmount
    transactionDescription = `Transfer out to ${walletName} from ${sourceAccount === "cash" ? "Cash Wallet" : "Bank Card"}`
  } else {
    // Pulling money BACK out of savings into current spendable funds
    if (currentSavings < numericAmount) {
      throw new Error(`Insufficient funds in your savings wallet! Current balance is Rs. ${currentSavings.toLocaleString()}`)
    }
    nextSavingsBalance -= numericAmount
    transactionDescription = `Transfer in from ${walletName} to ${sourceAccount === "cash" ? "Cash Wallet" : "Bank Card"}`
  }

  // 3. Update the Household Table Core Balance
  const { error: updateError } = await supabase
    .from("households")
    .update({ savings_balance: nextSavingsBalance })
    .eq("id", householdId)

  if (updateError) {
    throw new Error(`Failed to update financial vaults: ${updateError.message}`)
  }

  // 4. Log the transaction ledger entry to maintain perfect system audatibility
  // We mirror standard transfer structures so liquidity calculations automatically track changes!
  const { error: txError } = await supabase
    .from("transactions")
    .insert([
      {
        household_id: householdId,
        cycle_id: cycleId,
        created_by: userId,
        transaction_type: "transfer",
        amount: numericAmount,
        description: transactionDescription,
        // Critical: Set payment account to map where immediate cash is exiting or entering!
        payment_account: sourceAccount, 
        paid_by: "household",
        notes: `Savings adjustment matching direction: ${direction.toUpperCase()}`
      }
    ])

  if (txError) {
    // Rollback savings figure if transaction logging completely aborts
    await supabase.from("households").update({ savings_balance: currentSavings }).eq("id", householdId)
    throw new Error(`Transaction ledger sync failed: ${txError.message}. Vault changes rolled back safely.`)
  }

  return { success: true, newSavingsBalance: nextSavingsBalance }
}