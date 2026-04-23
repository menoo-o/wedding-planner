"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// import { da } from "zod/locales";


type DashboardSummary = {
  cashFund: number;
  totalSpend: number;
  topUps: number;
  openingBalance: number;
  netPosition: number;
  user: string;
  recentTransactions: Array<{
    id: string;
    transaction_type: string;
    amount: number;   
    payer_name: string;
    payment_source: string;
    reimbursement_status: string;
    description: string;
    created_at: string;
    
  }>;
};

// Logout Server Action
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear cached pages that depend on auth
  revalidatePath("/", "layout");

  // Send user back to login
  redirect("/login");
}


// Read Supabase Table Data (Updated for household_members)

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();

  // ---------------------------------------------------
  // 1. Get logged-in user
  // ---------------------------------------------------
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  // ---------------------------------------------------
  // 2. Find current user's household membership
  // (for now: assume 1 user belongs to 1 household)
  // ---------------------------------------------------
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .single();

  if (membershipError || !membership) {
    throw new Error(
      membershipError?.message || "No active household membership found"
    );
  }

  const householdId = membership.household_id;

  // ---------------------------------------------------
  // 3. Get current month cycle
  // ---------------------------------------------------
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: cycle, error: cycleError } = await supabase
    .from("monthly_cycles")
    .select("id, opening_balance")
    .eq("household_id", householdId)
    .eq("month", month)
    .eq("year", year)
    .single();

  if (cycleError || !cycle) {
    throw new Error(
      cycleError?.message || "Monthly cycle not found"
    );
  }

  // ---------------------------------------------------
  // 4. Get all transactions for current cycle
  // ---------------------------------------------------
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("transaction_type, amount, payer_name, payment_source, reimbursement_status, description")
    .eq("cycle_id", cycle.id);

  if (txError || !transactions) {
    throw new Error(
      txError?.message || "Could not load transactions"
    );
  }

  // console.log(transactions)

  // Recent Activity: Get 5 most recent transactions for the "Activity Feed" section
  const { data: recentTransactions, error: expenseError } = await supabase
  .from("transactions")
  .select("id,transaction_type, amount, payer_name, payment_source, reimbursement_status, description, created_at")
  .eq("cycle_id", cycle.id)
  .eq("transaction_type", "expense") // Only show expenses in that list
  .order("created_at", { ascending: false }) // Newest first
  .limit(4); // Only grab the top 4

    if (expenseError || !recentTransactions) {
    throw new Error(
      expenseError?.message || "Could not load transactions"
    );
  }


 // ---------------------------------------------------
// 5. Calculate values
// ---------------------------------------------------
let topUps = 0;       // Fresh money added to the household
let totalSpend = 0;   // Every penny spent by everyone (Gross Expense)
let cashExpenses = 0; // Money that actually left the physical "Household Fund"
let settledDebts = 0; // Expenses paid by others that the household has paid back

for (const tx of transactions) {
  const amount = Number(tx.amount);

  // Track total income/deposits for the month
  if (tx.transaction_type === "top_up") {
    topUps += amount;
  }

  // Track absolute total spending for Analytics (The "1st-30th" view)
  if (tx.transaction_type === "expense") {
    totalSpend += amount;
  }

  // Track physical cash outflows
  if (tx.transaction_type === "expense") {
    // Scenario A: Admin paid directly from the household cash/bank
    if (tx.payment_source === "household_fund") {
      cashExpenses += amount;
    } 
    
    // Scenario B: Someone else paid, but the household has already REIMBURSED them.
    // This also counts as a physical cash outflow from the fund.
    if (tx.payment_source !== "household_fund" && tx.reimbursement_status === "settled") {
      settledDebts += amount;
    }
  }
}

const openingBalance = Number(cycle.opening_balance);

/**
 * CASH FUND:
 * The physical money currently available.
 * Calculation: Start with what we had + New money - (Direct spends + Debts paid back)
 */
const cashFund = openingBalance + topUps - (cashExpenses + settledDebts);

/**
 * NET POSITION:
 * The "True" financial health of the household for the month.
 * It shows how much the household is actually "down" after all expenses are considered,
 * regardless of whether the physical cash has left the drawer yet.
 */
const netPosition = totalSpend; 

return {
  cashFund,       // "How much cash is in the box right now?"
  totalSpend,     // "How much did we actually consume this month?"
  topUps,         // "Total deposits"
  openingBalance, // "Start of month balance"
  netPosition,    // "Total liability/spending for this cycle"
  recentTransactions, // "Recent expenses for the activity feed",
  //also return the userID
  user: userId,

};            

}