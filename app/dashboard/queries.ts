//app/dashboard/queries.ts

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { HouseholdMember, MonthlyCycle, Category } from '@/lib/types'

export interface CycleCalculationTransaction {
  id: string
  amount: number
  transaction_type: "top_up" | "expense" | "transfer" | "loan_in" | "loan_out" | "loan_return" | "settlement" | "refund" | "adjustment"
  payment_account: "cash" | "card"
  description: string 
  related_transaction_id: string | null
  category_id: string | null // 🏆 Add this line right here!
  created_at: string | null
}

export interface LifetimeDebtTransaction {
  id: string
  amount: number
  transaction_type: "loan_in" | "loan_out" | "loan_return" | "settlement"
  related_transaction_id: string | null
}

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
      rawTransactions: [] // 🏆 CRITICAL: Ensure this fallback is here!
    }
  }

  householdMember = memberData

  // ── 4. Active cycle + prior closed cycle ──────────────────                 
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

  // 🏆 THE ADJUSTMENT: Seed the opening balance pool into CASH instead of CARD!
  const openingPool = cycle?.opening_balance ?? 0
  cashBalance = openingPool // 👈 CHANGE THIS LINE (Swap cardBalance to cashBalance)
  cardBalance = 0          // 👈 RESET CARD TO ZERO HERE
  
  // Most-recently closed cycle — used for historical burn rate fallback
  const { data: prevCycle } = await supabase
    .from("monthly_cycles")
    .select("id")
    .eq("household_id", memberData.household_id)
    .eq("is_closed", true)
    .order("created_at", { ascending: false })
    .limit(1)

  // ── 5. Parallel data fetch ────────────────────────────────
  // ── 5. Parallel data fetch ────────────────────────────────
  const [currentTxResult, prevTxResult, categoriesResult, lifetimeDebtResult] = await Promise.all([
    // Current cycle transactions
    cycle?.id
      ? supabase
          .from("transactions")
          // 🏆 CHANGE THIS LINE: Added ", description" right into the selection parameters string!
          .select("id, amount, transaction_type, payment_account, description, related_transaction_id, category_id, created_at, notes")
          .eq("household_id", memberData.household_id)
          .eq("cycle_id", cycle.id)
      : Promise.resolve({ data: null }),

    // Prior cycle expense totals (Leave as is!)
    prevCycle && prevCycle.length > 0
      ? supabase
          .from("transactions")
          .select("amount")
          .eq("household_id", memberData.household_id)
          .eq("cycle_id", prevCycle[0].id)
          .eq("transaction_type", "expense")
      : Promise.resolve({ data: null }),

    // Household categories (Leave as is!)
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", memberData.household_id)
      .overrideTypes<Category[]>(),

    // Fetch global debt entries across monthly limits (Leave as is!)
    supabase
      .from("transactions")
      .select("id, amount, transaction_type, related_transaction_id")
      .eq("household_id", memberData.household_id)
      .in("transaction_type", ["loan_out", "loan_in", "loan_return", "settlement"])
  ])

  // ── 6. Compute balances, receivables, payables, burn ─────
  
  // Part A: Process Active Cycle Core Wallets & Inflows/Outflows
 if (currentTxResult.data) {
    const cycleTxs = currentTxResult.data as unknown as CycleCalculationTransaction[]

    cycleTxs.forEach((tx) => {
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
      // ⇄ 🏆 DROP THIS REPLACED TRANSFER BLOCK HERE:
      else if (tx.transaction_type === "transfer") {
        const textSignature = tx.description ? tx.description.toLowerCase() : ""
        const isTransferIn = textSignature.includes("transfer in")
        const isTransferOut = textSignature.includes("transfer out")

        if (tx.payment_account === "cash") {
          if (isTransferIn) cashBalance += amt   // Money landed here -> adds to cash box
          if (isTransferOut) cashBalance -= amt  // Money left here -> removes from cash box
        }
        
        if (tx.payment_account === "card") {
          if (isTransferIn) cardBalance += amt   // Money landed here -> adds to bank card
          if (isTransferOut) cardBalance -= amt  // Money left here -> removes from bank card
        }
      }
    })
  }

  // Part B: Process Lifetime Debt Impact on Advanced Metric Aggregations
  if (lifetimeDebtResult.data) {
    const historicalTxs = lifetimeDebtResult.data as unknown as LifetimeDebtTransaction[]
    const resolvedDebtIds = new Set<string>()

    // PASS 1: Identify settled debt rows globally
    historicalTxs.forEach((tx) => {
      if (
        (tx.transaction_type === "loan_return" || tx.transaction_type === "settlement") && 
        tx.related_transaction_id
      ) {
        resolvedDebtIds.add(String(tx.related_transaction_id))
      }
    })

    // PASS 2: Accumulate metrics solely for records that are genuinely still active
    historicalTxs.forEach((tx) => {
      const currentTxId = String(tx.id)

      if (!resolvedDebtIds.has(currentTxId)) {
        if (tx.transaction_type === "loan_out") {
          receivables += tx.amount
        }
        if (tx.transaction_type === "loan_in") {
          payables += tx.amount
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

  // Assign categories
  if (!categoriesResult.error && categoriesResult.data) {
    categories = categoriesResult.data
  } else if (categoriesResult.error) {
    console.error("Failed to fetch categories:", categoriesResult.error)
  }

  // ── 7. Derived analytics ──────────────────────────────────
  const totalLiquidity = cashBalance + cardBalance
  const netDebt = receivables - payables

  const burnDenominator =
    currentExpenses > 0 ? currentExpenses :
    previousExpenses > 0 ? previousExpenses : 0
  const runway = burnDenominator > 0 ? totalLiquidity / burnDenominator : Infinity

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
   // 🏆 FIXED: Casts the current transaction rows perfectly to your defined Interface
    rawTransactions:  (currentTxResult.data as unknown as CycleCalculationTransaction[]) || []
  }
  
}

// 🏆 ACTIVE RECEIVABLES SELECTION UTILITY ENGINE
export async function getActiveReceivables(householdId: string, cycleId: string) {
  const supabase = await createClient()

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

  const settledLoanIds = new Set(
    records
      .filter((tx) => tx.transaction_type === "loan_return" && tx.related_transaction_id)
      .map((tx) => String(tx.related_transaction_id))
  )

  const activeLoans = records
    .filter((tx) => tx.transaction_type === "loan_out" && !settledLoanIds.has(String(tx.id)))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return activeLoans
}