// app/dashboard/page.tsx

import { Suspense } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Wallet,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  Sparkles,
  Bell,
} from "lucide-react"

import { getDashboardData } from './_services/dashboard'
import { getLiveServerLiquidity } from "./components/liquidity-widget/liquidity"

import { getVendors } from "@/app/dashboard/_services/vendors"


import RecentExpenses from "./components/ExpensesDashBlock/Activity"
import ActionBar from "./components/ui/ActionBar"

// ── Skeleton ──────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded-lg w-48 mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-56 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

// ── Data + Content ────────────────────────────────────────────

async function DashboardContent() {
  const {
    householdMember, monthlyCycle, categories, receivables, payables, netDebt, currentExpenses, previousExpenses, runway,
    debtLoadRatio, rawTransactions, walletName, savingsBalance,
    receivablesRecords, payablesRecords,
  } = await getDashboardData()

  const householdId = householdMember?.household_id ?? ""
  const currentCycleId = monthlyCycle?.id ?? ""
  const createdBy = householdMember?.user_id ?? ""

  const [liveLiquidity] = await Promise.all([
    getLiveServerLiquidity(householdId),
    getVendors(householdId),
  ])

  const { cash, card, total, monthlyExpenses } = liveLiquidity

 
  const rawExpenses = (rawTransactions || []).filter((tx) => tx.transaction_type === "expense")
  const expensesWithCategoryNames = rawExpenses.map((tx) => {
    const matchingCategory = categories.find((cat) => cat.id === tx.category_id)
    return { ...tx, category_name: matchingCategory ? matchingCategory.name : "General" }
  })

  const obligationCount = receivablesRecords.length + payablesRecords.length
  const velocityRatio = previousExpenses > 0 ? currentExpenses / previousExpenses : 0
  const isBurningFaster = velocityRatio > 1

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2d3436]">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back to your household ledger</p>
        </div>
        <div className="flex items-center gap-3">

          <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-sm transition-all relative">
            <Bell size={18} strokeWidth={1.5} />
            {obligationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#e17055] rounded-full" />
            )}
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#dfe6e9] flex items-center justify-center text-[#636e72] font-bold text-sm">
            {householdMember?.role?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>

      {/* ── Action Bar ───────────────────────────────────────── */}
      {/* WRAPPED in client component for modal state */}
      <ActionBar
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
        cashBalance={cash}
        cardBalance={card}
        initialCategories={categories.map(c => ({ id: c.id, name: c.name }))}
    />

      {/* ── Financial Snapshot ───────────────────────────────── */}
      {/* ... rest of your snapshot cards stay the same ... */}
      <div className="mb-2">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-4">
          Financial Snapshot
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Liquidity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <Wallet size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Liquidity</span>
          </div>
          <p className="text-2xl font-bold text-[#2d3436]">Rs {total.toLocaleString()}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>Cash: Rs {cash.toLocaleString()}</span>
            <span>·</span>
            <span>Card: Rs {card.toLocaleString()}</span>
          </div>
        </div>

        {/* This Month Spend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <TrendingDown size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">This Month Spend</span>
          </div>
          <p className="text-2xl font-bold text-[#e17055]">-Rs {monthlyExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">
            {previousExpenses > 0 ? (
              <span className={isBurningFaster ? "text-[#e17055]" : "text-[#00b894]"}>
                {isBurningFaster ? "▲" : "▼"} {Math.abs((velocityRatio - 1) * 100).toFixed(1)}% vs last month
              </span>
            ) : (
              "No prior data"
            )}
          </p>
        </div>

        {/* Obligations */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <Scale size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Obligations</span>
          </div>
          <p className="text-2xl font-bold text-[#2d3436]">{obligationCount}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>{receivablesRecords.length} receivable{receivablesRecords.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{payablesRecords.length} payable{payablesRecords.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Net Debt */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            {netDebt >= 0 ? (
              <ArrowUpRight size={14} strokeWidth={1.5} className="text-[#00b894]" />
            ) : (
              <ArrowDownRight size={14} strokeWidth={1.5} className="text-[#e17055]" />
            )}
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Net Debt</span>
          </div>
          <p className={`text-2xl font-bold ${netDebt >= 0 ? "text-[#00b894]" : "text-[#e17055]"}`}>
            {netDebt >= 0 ? "+" : "-"}Rs {Math.abs(netDebt).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {netDebt >= 0 ? "You're owed money" : "You owe money"}
          </p>
        </div>
      </div>

      {/* ── Insight Cards Row ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Credit & Debt */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-5">
            Credit & Debt
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Receivables</span>
              <span className="text-base font-bold text-[#00b894]">+Rs {receivables.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Payables</span>
              <span className="text-base font-bold text-[#e17055]">-Rs {payables.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Net Position</span>
              <span className="text-base font-bold text-[#2d3436]">
                {netDebt >= 0 ? "+" : ""}Rs {Math.abs(netDebt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Debt Load</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                debtLoadRatio < 30
                  ? "bg-[#e8f5e9] text-[#00b894]"
                  : debtLoadRatio < 70
                  ? "bg-[#fff3e0] text-[#fdcb6e]"
                  : "bg-[#ffebee] text-[#e17055]"
              }`}>
                {debtLoadRatio.toFixed(1)}% {debtLoadRatio < 30 ? "Safe" : debtLoadRatio < 70 ? "Medium" : "High"}
              </span>
            </div>
          </div>
        </div>

        {/* Velocity & Runway */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-5">
            Velocity & Runway
          </h3>
          <div className="space-y-5">
            <div>
              <span className="text-sm text-gray-500 block mb-1">Monthly Burn</span>
              <span className="text-lg font-bold text-[#2d3436]">
                ~Rs {Math.max(currentExpenses, previousExpenses).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block mb-2">Spending Velocity</span>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isBurningFaster ? "bg-[#e17055]" : "bg-[#00b894]"
                  }`}
                  style={{ width: `${Math.min(velocityRatio * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {isBurningFaster ? "Burning faster than last month" : "Under control"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 block mb-1">Cash Runway</span>
              <span className="text-lg font-bold text-[#2d3436] flex items-center gap-2">
                <Clock size={16} strokeWidth={1.5} className="text-gray-400" />
                {runway === Infinity ? "∞" : `${runway.toFixed(1)} months`}
              </span>
            </div>
          </div>
        </div>

        {/* Savings Vault */}
        <div className="bg-[#2d3436] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
          <div className="absolute top-4 right-4 opacity-10">
            <Shield size={64} strokeWidth={1} />
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mb-10" />
          
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Savings Vault</span>
          </div>
          
          <p className="text-sm text-gray-300 mt-4 mb-1">{walletName || "Emergency Fund"}</p>
          <p className="text-3xl font-bold">Rs {savingsBalance.toLocaleString()}</p>
          
          <button className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white/80 transition-colors">
            Manage Vault
          </button>
        </div>
      </div>

      {/* ── Recent Activity + Spending Analysis ──────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/expenses"
              className="text-xs font-medium text-gray-400 hover:text-[#8b9dc3] flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
            <RecentExpenses
              transactions={expensesWithCategoryNames}
              currentExpensesTotal={currentExpenses}
            />
          </div>
        </div>

        {/* Spending Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm">
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-5">
            Spending Analysis
          </h3>
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
              const total = currentExpenses || 1

              return sorted.map(([name, amount], i) => {
                const pct = (amount / total) * 100
                const colors = ["#8b9dc3", "#a8b8d8", "#c5d1e8", "#d5dde8", "#e8ecf2"]
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">{name}</span>
                      <span className="font-bold text-[#2d3436]">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: colors[i] || colors[4] }}
                      />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          COMMENTED OUT — moved to other pages or modals
          ═══════════════════════════════════════════════════════ */}
      {/* <DashForm ... /> */}
      {/* <TopUpForm ... />  done*/}
      {/* <LoanForm ... /> */}
      {/* <AddCategoryForm ... />  - done */} 
      {/* <ActivePayables ... /> */}
      {/* <ReceivablesList ... /> */}
      {/* <VendorAccountsWidget ... /> */}
      {/* <AdvancedMetrics ... /> */}
      {/* <LiquidityWidget ... /> */}
      {/* <SavingsVaultWidget ... /> */}
      {/* <HouseholdInfo ... /> */}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CLIENT COMPONENT — Action Bar with Modal State
// ═══════════════════════════════════════════════════════════════

