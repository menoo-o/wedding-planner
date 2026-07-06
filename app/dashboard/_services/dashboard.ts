// app/dashboard/_services/dashboard.ts

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

import { getHouseholdMember } from '../_db/household'
import { getActiveCycle, getPreviousCycleId } from '../_db/cycles'
import { getCycleTransactions, getPrevCycleExpenses } from '../_db/transactions'
import { getLifetimeDebtTransactions } from '../_db/debt'
import { getHouseholdCategories } from '../_db/categories'
import { computeBalances, computeLifetimeDebt, computeRunway, computeDebtLoadRatio } from '../_lib/finance'
import { DashboardData } from '@/lib/types'

const EMPTY_DASHBOARD: DashboardData = {
  householdMember: null,
  userId: null,
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
  rawTransactions: [],
  payablesRecords: [],
  receivablesRecords: [],
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  // ── 1. Auth ───────────────────────────────────────────────
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    console.error("Auth error:", error)
    redirect("/login")
  }

  // get user id
  const userId = data.claims.sub
  if (!userId) {
    console.error("No user ID found in claims")
    redirect("/login")
  }

  // ── 2. Household membership ───────────────────────────────
  const householdMember = await getHouseholdMember(data.claims.sub)
  if (!householdMember) return EMPTY_DASHBOARD


  const { household_id } = householdMember

  // ── 3. Active + previous cycle ────────────────────────────
  const [monthlyCycle, prevCycleId] = await Promise.all([
    getActiveCycle(household_id),
    getPreviousCycleId(household_id),
  ])

  // ── 4. Parallel data fetch ────────────────────────────────
  const [currentTxs, prevExpenseTxs, categories, lifetimeDebtTxs] = await Promise.all([
    monthlyCycle?.id ? getCycleTransactions(household_id, monthlyCycle.id) : Promise.resolve([]),
    prevCycleId ? getPrevCycleExpenses(household_id, prevCycleId) : Promise.resolve([]),
    getHouseholdCategories(household_id),
    getLifetimeDebtTransactions(household_id),
  ])

  // ── 5. Calculations ───────────────────────────────────────
  const openingBalance = monthlyCycle?.opening_balance ?? 0
  const { cashBalance, cardBalance, currentExpenses } = computeBalances(currentTxs, openingBalance)

  const previousExpenses = prevExpenseTxs.reduce((sum, tx) => sum + tx.amount, 0)

  const { receivables, payables } = computeLifetimeDebt(lifetimeDebtTxs)

  const totalLiquidity = cashBalance + cardBalance
  const netDebt = receivables - payables
  const runway = computeRunway(totalLiquidity, currentExpenses, previousExpenses)
  const debtLoadRatio = computeDebtLoadRatio(payables, totalLiquidity)

  // ── 6. Return ─────────────────────────────────────────────
  return {
    householdMember,
    userId,
    monthlyCycle,
    categories,
    cash: cashBalance,
    card: cardBalance,
    total: totalLiquidity,
    receivables,
    payables,
    netDebt,
    currentExpenses,
    previousExpenses,
    runway,
    debtLoadRatio,
    rawTransactions: currentTxs,
    payablesRecords: [],
    receivablesRecords: [],
  }
}