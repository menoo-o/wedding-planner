// app/dashboard/_services/dashboard.ts

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cache } from "react" // add this import if not already present
 import { computeLiveLiquidity } from "../_lib/finance"


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
  liveCash: 0,
  liveCard: 0,
  liveTotal: 0,
  liveMonthlyExpenses: 0,
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
  
  // Stage 3 — Parallel fetches. liveLiquidity is no longer a separate
  // network call: it's computed below from cyclePair + currentTxs, which
  // this batch is already fetching. That removes two duplicate Supabase
  // round-trips (monthly_cycles + transactions) that getLiveServerLiquidity
  // used to run on its own against the exact same rows.
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
 
  // NOTE: monthlyCycle must carry opening_cash_balance / opening_bank_balance
  // (raw columns) for this to line up with what getLiveServerLiquidity used
  // to select directly. If getCyclePair's `active` row doesn't already
  // include those two columns, add them to its select() — same query,
  // no extra round-trip, since you're already fetching this row.
  const liveLiquidity = computeLiveLiquidity(monthlyCycle, currentTxs)
 
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
    // computed in-process now, not fetched — same field names as before
    // so DashboardContent's destructuring doesn't need to change
    liveCash: liveLiquidity.cash,
    liveCard: liveLiquidity.card,
    liveTotal: liveLiquidity.total,
    liveMonthlyExpenses: liveLiquidity.monthlyExpenses,
  }
})
