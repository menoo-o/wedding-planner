// app/dashboard/_services/dashboard.ts

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cache } from "react" // add this import if not already present
 


import { getCyclePair, getCycleTransactionArgs } from '../_db/cycles';

import { 
  getCycleTransactions, 
  getPrevCycleExpenses, 
  getActiveDebtLedger,
} from '../_db/transactions';

// import { getLifetimeDebtTransactions } from '../_db/debt';
import { getHouseholdCategories } from '../_db/categories';
import { 
  computeBalances, 
  // computeLifetimeDebt, 
  computeRunway, 
  computeDebtLoadRatio 
} from '../_lib/finance';
import { DashboardData } from '@/lib/types';
import { getHouseholdMember, getHouseholdSavingsConfig } from '../_db/household';

const EMPTY_DASHBOARD: DashboardData = {
  householdMember: null,
  userId: null,
  monthlyCycle: null,
  categories: [],
  cash: 0,
  card: 0,
  total: 0,
  savingsBalance: 0,
  walletName: null,
  overallLiquidity: 0,
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
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}


export const getDashboardData = cache(async (): Promise<DashboardData> => {
  
  const supabase = await createClient()

  // Stage 1 — Auth
  const { data, error } = await withTimeout(supabase.auth.getClaims(), 4000, "auth.getClaims")
  if (error || !data?.claims?.sub) {
    console.error("Auth error:", error)
    redirect("/login")
  }
  const userId = data.claims.sub

  // Stage 2 — Household lookup
  const householdMember = await withTimeout(getHouseholdMember(userId), 4000, "getHouseholdMember")
  if (!householdMember) return EMPTY_DASHBOARD
  const { household_id } = householdMember

  // Stage 3 — Kick off ALL household-scoped fetches at once, including
  // the cycle-dependent ones, by chaining off cyclePair as soon as it's
  // ready instead of waiting on the whole Promise.all batch first.
  const cyclePairPromise = withTimeout(getCyclePair(household_id), 5000, "getCyclePair")

  const cycleTxsPromise = cyclePairPromise.then((cyclePair) => {
    const { currentCycleId, prevCycleId } = getCycleTransactionArgs(cyclePair)
    return withTimeout(
      Promise.all([
        currentCycleId ? getCycleTransactions(household_id, currentCycleId) : Promise.resolve([]),
        prevCycleId ? getPrevCycleExpenses(household_id, prevCycleId) : Promise.resolve([]),
      ]),
      5000,
      "cycle-scoped-fetch"
    )
  })

  const [cyclePair, categories, savingsConfig, debtLedger, [currentTxs, prevExpenseTxs]] =
    await Promise.all([
      cyclePairPromise,
      withTimeout(getHouseholdCategories(household_id), 5000, "getHouseholdCategories"),
      withTimeout(getHouseholdSavingsConfig(household_id), 5000, "getHouseholdSavingsConfig"),
      withTimeout(getActiveDebtLedger(household_id), 5000, "getActiveDebtLedger"),
      cycleTxsPromise,
    ])

  const { active: monthlyCycle, openingBalance } = cyclePair

  // Calculations — unchanged
  const { cashBalance, cardBalance, currentExpenses } = computeBalances(currentTxs, openingBalance)
  const previousExpenses = prevExpenseTxs.reduce((sum, tx) => sum + tx.amount, 0)

  const receivables = debtLedger.totalReceivable
  const payables = debtLedger.totalPayable
  const receivablesRecords = debtLedger.receivables
  const payablesRecords = debtLedger.payables

  const savingsBalance = savingsConfig?.savings_balance ?? 0
  const walletName = savingsConfig?.savings_wallet_name ?? null
  const totalSpendable = cashBalance + cardBalance
  const overallLiquidity = totalSpendable + savingsBalance
  const netDebt = receivables - payables
  const runway = computeRunway(totalSpendable, currentExpenses, previousExpenses)
  const debtLoadRatio = computeDebtLoadRatio(payables, totalSpendable)

  return {
    householdMember,
    userId,
    monthlyCycle,
    categories,
    cash: cashBalance,
    card: cardBalance,
    total: totalSpendable,
    savingsBalance,
    walletName,
    overallLiquidity,
    receivables,
    payables,
    netDebt,
    currentExpenses,
    previousExpenses,
    runway,
    debtLoadRatio,
    rawTransactions: currentTxs,
    payablesRecords,
    receivablesRecords,
  }
})