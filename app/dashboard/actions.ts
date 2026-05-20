// "use server";

// import { createClient } from "@/utils/supabase/server";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// // import { da } from "zod/locales";


// type DashboardSummary = {
//   // Calculated Financial Totals
//   cashFund: number;       // The physical "liquidity" available right now
//   totalSpend: number;     // Gross consumption (everything spent this month)
//   topUps: number;         // Total new money added in this cycle
//   openingBalance: number; // The "Carry Forward" from last month
//   netPosition: number;    // True health (Cash Fund - Unpaid Pending Debts)
//   receivables: number;    // Money owed to household (e.g. loans given out)
//   // User Context
//   user: string;           // The UUID of the logged-in user

//   // The Recent Activity Feed
//   recentTransactions: Array<{
//     id: string;
//     transaction_type: 'expense' | 'top_up' | 'loan_out'; // Use literals for better autocomplete
//     amount: number;
//     counterparty_name: string;
//     payment_source: 'household_fund' | 'personal_cash';
//     reimbursement_status: 'none' | 'pending' | 'settled';
//     description: string;
//     created_at: string;
//   }>;
// };

// // Logout Server Action
// export async function logout() {
//   const supabase = await createClient();
//   await supabase.auth.signOut();

//   // Clear cached pages that depend on auth
//   revalidatePath("/", "layout");

//   // Send user back to login
//   redirect("/login");
// }


// // Read Supabase Table Data (Updated for household_members)

// export async function getDashboardSummary(): Promise<DashboardSummary> {
//   const supabase = await createClient();

//   // ---------------------------------------------------
//   // 1. Get logged-in user
//   // ---------------------------------------------------
//   const { data, error } = await supabase.auth.getClaims();

//   if (error || !data?.claims) {
//     redirect("/login");
//   }

//   const userId = data.claims.sub;

//   // ---------------------------------------------------
//   // 2. Find current user's household membership
//   // (for now: assume 1 user belongs to 1 household)
//   // ---------------------------------------------------
//   const { data: membership, error: membershipError } = await supabase
//     .from("household_members")
//     .select("household_id, role, status")
//     .eq("user_id", userId)
//     .eq("status", "active")
//     .limit(1)
//     .single();

//   if (membershipError || !membership) {
//     throw new Error(
//       membershipError?.message || "No active household membership found"
//     );
//   }

//   const householdId = membership.household_id;

//   // ---------------------------------------------------
//   // 3. Get current month cycle
//   // ---------------------------------------------------
//   const now = new Date();
//   const month = now.getMonth() + 1;
//   const year = now.getFullYear();

//   const { data: cycle, error: cycleError } = await supabase
//     .from("monthly_cycles")
//     .select("id, opening_balance")
//     .eq("household_id", householdId)
//     .eq("month", month)
//     .eq("year", year)
//     .single();

//   if (cycleError || !cycle) {
//     throw new Error(
//       cycleError?.message || "Monthly cycle not found"
//     );
//   }

//   // ---------------------------------------------------
//   // 4. Get all transactions for current cycle
//   // ---------------------------------------------------
//   const { data: transactions, error: txError } = await supabase
//     .from("transactions")
//     .select("transaction_type, amount, counterparty_name, payment_source, reimbursement_status, description")
//     .eq("cycle_id", cycle.id);

//   if (txError || !transactions) {
//     // throw new Error(
//     //   txError?.message || "Could not load transactions"
//     // );
//     console.log("smth fisht")
//   }

//   // console.log(transactions)

//   // Recent Activity: Get 5 most recent transactions for the "Activity Feed" section
//   const { data: recentTransactions, error: expenseError } = await supabase
//   .from("transactions")
//   .select("id,transaction_type, amount, counterparty_name, payment_source, reimbursement_status, description, created_at")
//   .eq("cycle_id", cycle.id)
//   .eq("transaction_type", "expense") // Only show expenses in that list
//   .order("created_at", { ascending: false }) // Newest first
//   .limit(4); // Only grab the top 4

//     if (expenseError || !recentTransactions) {
//     throw new Error(
//       expenseError?.message || "Could not load transactions"
//     );
//   }


// // ---------------------------------------------------
// // 5. Calculate values (Full Ledger Logic)
// // ---------------------------------------------------

// let topUps = 0;                 // Fresh money into household
// let totalSpend = 0;            // Real household consumption
// let directCashSpend = 0;       // Expenses paid instantly by household fund

// let payables = 0;              // Household owes others
// let settlementsPaid = 0;       // Cash used to clear payables

// let receivables = 0;           // Others owe household
// let loansGiven = 0;            // Cash lent outward
// let loansRecovered = 0;        // Cash returned from borrowers

// let refundsIn = 0;             // Expense refunds received
// let adjustmentsIn = 0;         // Positive corrections
// let adjustmentsOut = 0;        // Negative corrections

// for (const tx of transactions) {
//   const amount = Number(tx.amount);

//   // ------------------------------------------------
//   // A) TOP UPS
//   // ------------------------------------------------
//   if (tx.transaction_type === "top_up") {
//     topUps += amount;
//     continue;
//   }

//   // ------------------------------------------------
//   // B) EXPENSES (Real Consumption)
//   // ------------------------------------------------
//   if (tx.transaction_type === "expense") {
//     totalSpend += amount;

//     // Paid directly from household fund
//     if (tx.payment_source === "household_fund") {
//       directCashSpend += amount;
//     }

//     // Someone else paid for household
//     else {
//       // If still unpaid = liability exists
//       if (tx.reimbursement_status === "pending") {
//         payables += amount;
//       }

//       // If already reimbursed = liability cleared, cash left house
//       if (tx.reimbursement_status === "settled") {
//         settlementsPaid += amount;
//       }
//     }

//     continue;
//   }

//   // ------------------------------------------------
//   // C) HOUSEHOLD LENT MONEY TO SOMEONE
//   // ------------------------------------------------
//   if (tx.transaction_type === "loan_out") {
//     loansGiven += amount;

//     if (tx.reimbursement_status === "pending") {
//       receivables += amount;
//     }

//     continue;
//   }

//   // ------------------------------------------------
//   // D) MONEY RETURNED TO HOUSEHOLD
//   // ------------------------------------------------
//   if (tx.transaction_type === "loan_return") {
//     loansRecovered += amount;

//     // reduces outstanding receivable
//     receivables -= amount;

//     continue;
//   }

//   // ------------------------------------------------
//   // E) SETTLEMENT ROW (Explicit repayment by house)
//   // optional if you store separate settlement rows
//   // ------------------------------------------------
//   if (tx.transaction_type === "settlement") {
//     settlementsPaid += amount;
//     payables -= amount;

//     continue;
//   }

//   // ------------------------------------------------
//   // F) REFUND RECEIVED
//   // Example: order cancelled / money returned
//   // ------------------------------------------------
//   if (tx.transaction_type === "refund") {
//     refundsIn += amount;
//     continue;
//   }

//   // ------------------------------------------------
//   // G) MANUAL ADJUSTMENTS
//   // ------------------------------------------------
//   if (tx.transaction_type === "adjustment") {
//     if (amount >= 0) {
//       adjustmentsIn += amount;
//     } else {
//       adjustmentsOut += Math.abs(amount);
//     }

//     continue;
//   }
// }

// const openingBalance = Number(cycle.opening_balance);

// // ---------------------------------------------------
// // CASH FUND = Physical money available right now
// // ---------------------------------------------------
// const cashFund =
//   openingBalance +
//   topUps +
//   loansRecovered +
//   refundsIn +
//   adjustmentsIn -
//   (
//     directCashSpend +
//     settlementsPaid +
//     loansGiven +
//     adjustmentsOut
//   );

// // ---------------------------------------------------
// // NET POSITION = True financial standing
// // cash + what others owe us - what we owe others
// // ---------------------------------------------------
// const netPosition =
//   cashFund +
//   receivables -
//   payables;

// return {
//   cashFund,
//   totalSpend,
//   topUps,
//   openingBalance,
//   netPosition,
//   recentTransactions,
//   receivables,
//   user: userId,
// };  

// }


// // available liquidity | 
// // total spend | net position  | Reimbursement pending (liabilities) 
// // burn rate below | projected runaway | 