import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { HouseholdMember, MonthlyCycle, Category } from '@/lib/types'

// ─────────────────────────────────────────────────────────────
// readSupaTables
// Single server-side fetch that loads everything the dashboard
// needs. Called once from layout.tsx and passed into the
// DashboardProvider — no component makes its own Supabase calls.
// ─────────────────────────────────────────────────────────────
export async function readSupaTables() {
  const supabase = await createClient()

  // ── 1. Auth ──────────────────────────────────────────────
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    console.error("Auth error:", error)
    redirect("/login")
  }

  // ── 2. Shared state ───────────────────────────────────────
  let householdMember: HouseholdMember | null = null
  let monthlyCycle: MonthlyCycle | null = null
  let categories: Category[] = []

  let cashBalance = 0
  let cardBalance = 0
  let receivables = 0
  let payables = 0
  let currentExpenses = 0
  let previousExpenses = 0

  // ── 3. Household membership ───────────────────────────────
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role, status, user_id")
    .eq("user_id", data.claims.sub)
    .eq("status", "active")
    .single<HouseholdMember>()

  if (memberError || !memberData) {
    console.error("Failed to fetch household member:", memberError)
    // Return a safe empty shell — layout can show an onboarding state
    return {
      householdMember: null,
      monthlyCycle: null,
      categories: [],
      cash: 0,
      card: 0,
      total: 0,
      receivables: 0,
      payables: 0,
      netDebt: 0,
      currentExpenses: 0,
      previousExpenses: 0,
      runway: Infinity,
      debtLoadRatio: 0,
    }
  }

  householdMember = memberData

  // ── 4. Active cycle + prior closed cycle (sequential — each ──
  //       depends on household_id from step 3)                 
  const { data: cycle, error: cycleError } = await supabase
    .from("monthly_cycles")
    .select("*")
    .eq("household_id", memberData.household_id)
    .eq("is_closed", false)
    .single<MonthlyCycle>()

  if (cycleError) {
    console.error("Failed to fetch monthly cycle:", cycleError)
  } else {
    monthlyCycle = cycle
  }

  // Seed cash balance from the cycle's opening balance
  cashBalance = cycle?.opening_balance ?? 0

  // Most-recently closed cycle — used for historical burn rate fallback
  const { data: prevCycle } = await supabase
    .from("monthly_cycles")
    .select("id")
    .eq("household_id", memberData.household_id)
    .eq("is_closed", true)
    .order("created_at", { ascending: false })
    .limit(1)




  // ── 5. Parallel data fetch ────────────────────────────────
  // All three queries are independent; fire them together.
  const [currentTxResult, prevTxResult, categoriesResult] = await Promise.all([
    // Current cycle transactions — full detail for balance + analytics
    cycle?.id
      ? supabase
          .from("transactions")
          .select("amount, transaction_type, payment_account")
          .eq("household_id", memberData.household_id)
          .eq("cycle_id", cycle.id)
      : Promise.resolve({ data: null }),

    // Prior cycle expense totals — used as burn rate fallback
    prevCycle && prevCycle.length > 0
      ? supabase
          .from("transactions")
          .select("amount")
          .eq("household_id", memberData.household_id)
          .eq("cycle_id", prevCycle[0].id)
          .eq("transaction_type", "expense")
      : Promise.resolve({ data: null }),

    // Household categories — passed into the expense form
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", memberData.household_id)
      .overrideTypes<Category[]>(),
  ])

  // ── 6. Compute balances, receivables, payables, burn ─────
if (currentTxResult.data) {
  // 🏆 FIRST PASS: Gather all settlement linkages so we know what is paid off
  const settledTransactionIds = new Set<string>()
  
  currentTxResult.data.forEach((tx: any) => {
    // If it's a return or settlement pointing back to an original loan, track it
    if ((tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") && tx.related_transaction_id) {
      settledTransactionIds.add(tx.related_transaction_id)
    }
  })

  // 🏆 SECOND PASS: Process liquidity states and sum ONLY ACTIVE loans
  currentTxResult.data.forEach((tx: any) => {
    const amt = tx.amount

    // Core Liquidity Inflows
    if (tx.transaction_type === "top_up" || tx.transaction_type === "loan_return" || tx.transaction_type === "loan_in") {
      if (tx.payment_account === "cash") cashBalance += amt
      if (tx.payment_account === "card") cardBalance += amt
    } 
    // Core Liquidity Outflows
    else if (tx.transaction_type === "expense" || tx.transaction_type === "settlement" || tx.transaction_type === "loan_out") {
      if (tx.payment_account === "cash") cashBalance -= amt
      if (tx.payment_account === "card") cardBalance -= amt
      
      if (tx.transaction_type === "expense") currentExpenses += amt
    }
    // Internal Vault Transfers
    else if (tx.transaction_type === "transfer") {
      if (tx.payment_account === "cash") cashBalance -= amt
      if (tx.payment_account === "card") cardBalance += amt
    }

    // 🏆 PENDING LOANS INTELLIGENCE: Only add to dashboard metrics if NOT settled!
    if (!settledTransactionIds.has(tx.id)) {
      if (tx.transaction_type === "loan_out") {
        receivables += amt // Capital you lent out that is still missing
      }
      if (tx.transaction_type === "loan_in") {
        payables += amt    // Capital you borrowed that you still owe out
      }
    }
  })
}
  // Sum prior-cycle expenses for the burn rate fallback
  if (prevTxResult.data) {
    prevTxResult.data.forEach((tx) => {
      previousExpenses += tx.amount
    })
  }

  // Assign categories (already fetched in the parallel block above)
  if (!categoriesResult.error && categoriesResult.data) {
    categories = categoriesResult.data
  } else if (categoriesResult.error) {
    console.error("Failed to fetch categories:", categoriesResult.error)
  }

  // ── 7. Derived analytics ──────────────────────────────────
  const totalLiquidity = cashBalance + cardBalance
  const netDebt = receivables - payables

  // Runway = how many "current cycles" of spending the balance can cover.
  // Falls back to prior-cycle burn if this cycle has no expenses yet.
  const burnDenominator =
    currentExpenses > 0 ? currentExpenses :
    previousExpenses > 0 ? previousExpenses : 0
  const runway = burnDenominator > 0 ? totalLiquidity / burnDenominator : Infinity

  // Debt load ratio = outstanding payables as % of liquid assets.
  // Clamped to 100 if assets are zero but debt exists.
  const debtLoadRatio =
    totalLiquidity > 0
      ? (payables / totalLiquidity) * 100
      : payables > 0 ? 100 : 0

  // ── 8. Return ─────────────────────────────────────────────
  return {
    householdMember,
    monthlyCycle,
    categories,
    cash:             cashBalance,
    card:             cardBalance,
    total:            totalLiquidity,
    receivables,
    payables,
    netDebt,
    currentExpenses,
    previousExpenses,
    runway,
    debtLoadRatio,
    
  }
}


// app/dashboard/queries.ts

// app/dashboard/queries.ts

// app/dashboard/queries.ts

export async function getActiveReceivables(householdId: string, cycleId: string) {
  const supabase = await createClient()

  // 1. Pull ALL loans out and loan returns for this cycle to map connections in memory
  const { data: records, error } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, payment_account, counterparty_name, description, created_at, notes, related_transaction_id")
    .eq("household_id", householdId)
    .eq("cycle_id", cycleId)
    .in("transaction_type", ["loan_out", "loan_return"])

  if (error) {
    console.error("Failed to pull active receivables ledger:", error.message)
    return []
  }

  if (!records) return []

  // 2. Build a set of all transaction IDs that have already received a repayment
  const settledLoanIds = new Set(
    records
      .filter((tx) => tx.transaction_type === "loan_return" && tx.related_transaction_id)
      .map((tx) => tx.related_transaction_id)
  )

  // 3. One-Shot Filtering: Only return 'loan_out' rows whose IDs are NOT in the settled set
  const activeLoans = records
    .filter((tx) => tx.transaction_type === "loan_out" && !settledLoanIds.has(tx.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return activeLoans
}