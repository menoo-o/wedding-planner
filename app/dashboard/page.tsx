// app/dashboard/page.tsx

import { Suspense } from "react"
import Link from "next/link"
import {
  ChevronRight,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  Sparkles,
} from "lucide-react"

import { getDashboardData } from './_services/dashboard'

// import { getLiveServerLiquidity } from "./components/liquidity-widget/liquidity"
// import { getVendors } from "@/app/dashboard/_services/vendors"
import RecentExpenses from "./components/ExpensesDashBlock/Activity"
import DashboardSkeleton from "./components/DashboardSkeleton"
import LiquidityCard from "./components/liquidity-widget/LiquidityCard"
import {ExpenseTransaction } from '@/lib/types'

// ── Main Page ─────────────────────────────────────────────────

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

//dashboard/page.tsx - the main page !
// ── Data + Content ────────────────────────────────────────────

async function DashboardContent() {
  const {
     categories, receivables, payables, netDebt, currentExpenses, previousExpenses, runway,
    debtLoadRatio, rawTransactions, walletName, savingsBalance,
    receivablesRecords, payablesRecords, currentCycleId, householdMember,
    liveCash: cash, liveCard: card, liveTotal: total, liveMonthlyExpenses: monthlyExpenses,
  } = await getDashboardData()



 
  const rawExpenses = (rawTransactions || []).filter((tx) => tx.transaction_type === "expense")
  const expensesWithCategoryNames = rawExpenses.map((tx) => {
    const matchingCategory = categories.find((cat) => cat.id === tx.category_id)
    return { ...tx, category_name: matchingCategory ? matchingCategory.name : "General" }
  })

  const obligationCount = receivablesRecords.length + payablesRecords.length
  const velocityRatio = previousExpenses > 0 ? currentExpenses / previousExpenses : 0
  const isBurningFaster = velocityRatio > 1
 //dashboard/page.tsx
 return (
    <>
   <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:px-0">
    {/* ── Top Bar ─────────────────────────────────────────── */}
    <header className="flex min-h-[3rem] items-center justify-between">
      <div className="max-w-[58%] lg:max-w-none">
        <h1 className="text-xl font-semibold tracking-tight text-[#2d3436] sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-500 sm:text-sm">
          Welcome back to your household ledger
        </p>
      </div>
    </header>

    {/* ── Financial Snapshot ──────────────────────────────── */}
    <section aria-labelledby="snapshot-heading" className="space-y-3 sm:space-y-4">
      <h2 id="snapshot-heading" className={eyebrow}>Financial Snapshot</h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <LiquidityCard
          cash={cash}
          card={card}
          total={total}
          walletName={walletName}
          savingsBalance={savingsBalance}
          householdId={householdMember?.household_id}
          currentCycleId={currentCycleId ?? null}
        />

        {/* This Month Spend */}
        <div className={`${cardHover} p-4 sm:p-6`}>
          <div className="mb-3 flex items-center gap-2 text-gray-400">
            <TrendingDown size={14} strokeWidth={1.5} className="shrink-0" />
            <span className={`${eyebrow} leading-snug`}>This Month Spend</span>
          </div>
          <p className={`${stat} ${NEG}`}>-Rs {monthlyExpenses.toLocaleString()}</p>
          <p className="mt-2 text-xs text-gray-500">
            {previousExpenses > 0 ? (
              <span className={`font-medium ${isBurningFaster ? NEG : POS}`}>
                {isBurningFaster ? "▲" : "▼"} {Math.abs((velocityRatio - 1) * 100).toFixed(1)}% vs last month
              </span>
            ) : (
              "No prior data"
            )}
          </p>
        </div>

        {/* Obligations */}
        <div className={`${cardHover} p-4 sm:p-6`}>
          <div className="mb-3 flex items-center gap-2 text-gray-400">
            <Scale size={14} strokeWidth={1.5} className="shrink-0" />
            <span className={`${eyebrow} leading-snug`}>Obligations</span>
          </div>
          <p className={`${stat} text-[#2d3436]`}>{obligationCount}</p>
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500">
            <span>{receivablesRecords.length} receivable{receivablesRecords.length !== 1 ? "s" : ""}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{payablesRecords.length} payable{payablesRecords.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Net Debt */}
        <div className={`${cardHover} p-4 sm:p-6`}>
          <div className="mb-3 flex items-center gap-2 text-gray-400">
            {netDebt >= 0 ? (
              <ArrowUpRight size={14} strokeWidth={1.5} className={`shrink-0 ${POS}`} />
            ) : (
              <ArrowDownRight size={14} strokeWidth={1.5} className={`shrink-0 ${NEG}`} />
            )}
            <span className={`${eyebrow} leading-snug`}>Net Debt</span>
          </div>
          <p className={`${stat} ${netDebt >= 0 ? POS : NEG}`}>
            {netDebt >= 0 ? "+" : "-"}Rs {Math.abs(netDebt).toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {netDebt >= 0 ? "You're owed money" : "You owe money"}
          </p>
        </div>
      </div>
    </section>

    {/* ── Insight Cards ───────────────────────────────────── */}
{/* ── Insight Cards ───────────────────────────────────── */}
<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
  {/* Credit & Debt */}
  <div className={`${cardSurface} p-5 sm:p-6`}>
    <h3 className={`${eyebrow} mb-4`}>Credit &amp; Debt</h3>
    <dl className="divide-y divide-gray-100">
      <div className="flex items-center justify-between py-3 first:pt-0">
        <dt className="text-sm text-gray-600">Receivables</dt>
        <dd className={`text-base font-semibold tabular-nums ${POS}`}>
          +Rs {receivables.toLocaleString()}
        </dd>
      </div>
      <div className="flex items-center justify-between py-3">
        <dt className="text-sm text-gray-600">Payables</dt>
        <dd className={`text-base font-semibold tabular-nums ${NEG}`}>
          -Rs {payables.toLocaleString()}
        </dd>
      </div>
      <div className="flex items-center justify-between py-3">
        <dt className="text-sm text-gray-600">Net Position</dt>
        <dd className="text-base font-semibold tabular-nums text-[#2d3436]">
          {netDebt >= 0 ? "+" : ""}Rs {Math.abs(netDebt).toLocaleString()}
        </dd>
      </div>
      <div className="flex items-center justify-between py-3 last:pb-0">
        <dt className="text-sm text-gray-600">Debt Load</dt>
        <dd
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
            debtLoadRatio < 30
              ? "bg-emerald-50 text-[#008060]"
              : debtLoadRatio < 70
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-[#c2492f]"
          }`}
        >
          {debtLoadRatio.toFixed(1)}% {debtLoadRatio < 30 ? "Safe" : debtLoadRatio < 70 ? "Medium" : "High"}
        </dd>
      </div>
    </dl>
  </div>

  {/* Velocity & Runway */}
  <div className={`${cardSurface} p-5 sm:p-6`}>
    <h3 className={`${eyebrow} mb-4`}>Velocity &amp; Runway</h3>
    <div className="space-y-5">
      <div>
        <span className="mb-1 block text-sm text-gray-600">Monthly Burn</span>
        <span className="text-lg font-semibold tabular-nums text-[#2d3436]">
          ~Rs {Math.max(currentExpenses, previousExpenses).toLocaleString()}
        </span>
      </div>
      <div>
        <span className="mb-2 block text-sm text-gray-600">Spending Velocity</span>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full transition-all ${
              isBurningFaster ? "bg-[#e17055]" : "bg-[#00b894]"
            }`}
            style={{ width: `${Math.min(velocityRatio * 100, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {isBurningFaster ? "Burning faster than last month" : "Under control"}
        </p>
      </div>
      <div>
        <span className="mb-1 block text-sm text-gray-600">Cash Runway</span>
        <span className="flex items-center gap-2 text-lg font-semibold tabular-nums text-[#2d3436]">
          <Clock size={16} strokeWidth={1.5} className="text-gray-400" />
          {runway === Infinity ? "∞" : `${runway.toFixed(1)} months`}
        </span>
      </div>
    </div>
  </div>

  {/* Savings Vault */}
  <div className="relative overflow-hidden rounded-2xl bg-[#2d3436] p-5 text-white shadow-sm sm:col-span-2 sm:p-6 lg:col-span-1">
    <div className="absolute right-4 top-4 opacity-10">
      <Shield size={64} strokeWidth={1} />
    </div>
    <div className="absolute bottom-0 right-0 -mb-10 -mr-10 h-32 w-32 rounded-full bg-white/5" />

    <div className="relative">
      <div className="flex items-center gap-2">
        <Sparkles size={14} strokeWidth={1.5} className="text-gray-300" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-300">
          Savings Vault
        </span>
      </div>

      <p className="mb-1 mt-5 text-sm text-gray-300">{walletName || "Emergency Fund"}</p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        Rs {savingsBalance.toLocaleString()}
      </p>

      <button className="mt-6 w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
        Manage Vault
      </button>
    </div>
  </div>
</section>

    {/* ── Recent Activity + Spending Analysis ─────────────── */}
    <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      {/* Recent Activity */}
      <div className="space-y-3 lg:col-span-2">
        <div className="flex h-5 items-center justify-between">
          <h2 className={eyebrow}>Recent Activity</h2>
          <Link
            href="/dashboard/expenses"
            className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-[#6f84b0]"
          >
            View All <ChevronRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <RecentExpenses
              transactions={expensesWithCategoryNames as unknown as ExpenseTransaction[]}
              currentExpensesTotal={currentExpenses}
            />
          </div>
        </div>
      </div>

      {/* Spending Analysis */}
      <div className="space-y-3">
        <div className="flex h-5 items-center">
          <h2 className={eyebrow}>Spending Analysis</h2>
        </div>
        <div className={`${card} p-5 sm:p-6`}>
          <div className="space-y-5">
            {(() => {
              const categoryTotals = new Map<string, number>()
              expensesWithCategoryNames.forEach((tx) => {
                const name = tx.category_name || "General"
                categoryTotals.set(name, (categoryTotals.get(name) || 0) + tx.amount)
              })
              const sorted = Array.from(categoryTotals.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
              const spendTotal = currentExpenses || 1
              const colors = ["#6f84b0", "#8b9dc3", "#a3b3d3", "#bccae2", "#d0d9ea"]

              if (sorted.length === 0) {
                return <p className="text-sm text-gray-500">No spending yet this cycle</p>
              }

              return sorted.map(([name, amount], i) => {
                const pct = (amount / spendTotal) * 100
                return (
                  <div key={name}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="truncate text-[11px] font-medium uppercase tracking-wider text-gray-600">
                        {name}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-[#2d3436]">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: colors[i] ?? colors[4] }}
                      />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </section>
  </div>
  </>
  )
}



const card = "bg-white rounded-2xl border border-gray-200/70 shadow-sm"

// const cardHover = `${card} transition-shadow hover:shadow-md`
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
const stat = "text-xl sm:text-2xl font-semibold tracking-tight tabular-nums"
const POS = "text-[#008060]" // readable green for text (keep #00b894 for fills)
const NEG = "text-[#c2492f]" // readable red for text (keep #e17055 for fills)

const cardSurface = "bg-white rounded-2xl border border-gray-200/70 shadow-sm"
const cardHover = `${cardSurface} transition-shadow hover:shadow-md`