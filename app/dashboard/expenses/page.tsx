// app/dashboard/expenses/page.tsx

import { Suspense } from "react"
import Link from "next/link"
import {
  Wallet,
  TrendingDown,
  Scale,
  ChevronRight,
  Clock,
  Search,
  Bell,
} from "lucide-react"

import { getDashboardData } from '../_services/dashboard'
import { getCycleTransactions, getTransactionsByType } from "../_db/transactions"
import { getCyclePair } from "../_db/cycles"
import { getHouseholdCategories } from "../_db/categories"
import ActionBar from "../components/ui/ActionBar"
import ExpensesFilterBar from "../components/ExpensesFilterBar"

// ── Types ─────────────────────────────────────────────────────

interface ExpenseTransaction {
  id: string
  amount: number
  transaction_type: string
  payment_account: string
  description: string
  category_id: string | null
  category_name?: string
  created_at: string
  paid_by?: string | null
  counterparty_name?: string | null
  reimbursement_status?: string | null
}

interface DayGroup {
  date: string
  label: string
  transactions: ExpenseTransaction[]
  dayTotal: number
}

interface MonthlyCycle {
  id: string
  household_id: string
  created_at: string
  is_closed: boolean
  opening_balance: number
}

// ── Helpers ───────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday = date.toDateString() === today.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return "Today"
  if (isYesterday) return "Yesterday"

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function groupByDay(transactions: ExpenseTransaction[]): DayGroup[] {
  const groups = new Map<string, ExpenseTransaction[]>()

  for (const tx of transactions) {
    const dateKey = new Date(tx.created_at).toISOString().split("T")[0]
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey)!.push(tx)
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  return sortedKeys.map((key) => {
    const txs = groups.get(key)!
    const dayTotal = txs.reduce((sum, tx) => sum + tx.amount, 0)
    return {
      date: key,
      label: formatDateLabel(key),
      transactions: txs,
      dayTotal,
    }
  })
}

// Get top 3 categories by spending
function getTopCategories(
  transactions: ExpenseTransaction[],
  allCategories: { id: string; name: string }[]
) {
  const categoryTotals = new Map<string, number>()
  transactions.forEach((tx) => {
    const catId = tx.category_id || "uncategorized"
    categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + tx.amount)
  })

  const sorted = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return sorted.map(([catId, total]) => {
    const cat = allCategories.find((c) => c.id === catId)
    return { id: catId, name: cat?.name || "General", total }
  })
}

// ── Skeleton ──────────────────────────────────────────────────

function ExpensesSkeleton() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded-lg w-48 mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-16 bg-gray-200 rounded-xl mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    payment?: string
    sort?: string
    search?: string
    cycle?: string
  }>
}) {
  return (
    <Suspense fallback={<ExpensesSkeleton />}>
      <ExpensesContent searchParams={searchParams} />
    </Suspense>
  )
}

// ── Data + Content ────────────────────────────────────────────

async function ExpensesContent({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    payment?: string
    sort?: string
    search?: string
    cycle?: string
  }>
}) {
  const params = await searchParams

  // Get auth + household
  const {
    householdMember,
    monthlyCycle,
    categories,
    currentExpenses,
    previousExpenses,
    rawTransactions,
    payablesRecords,
    receivablesRecords,
    cash,
    card,
  } = await getDashboardData()

  const householdId = householdMember?.household_id ?? ""
  const currentCycleId = monthlyCycle?.id ?? ""
  const createdBy = householdMember?.user_id ?? ""

  // Fetch all household cycles for the cycle selector
  const supabase = (await import("@/utils/supabase/server")).createClient
  const { data: allCycles } = await (await supabase())
    .from("monthly_cycles")
    .select("id, created_at, is_closed")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })

  const cycles: MonthlyCycle[] = (allCycles || []).map((c: any) => ({
    id: c.id,
    household_id: householdId,
    created_at: c.created_at,
    is_closed: c.is_closed,
    opening_balance: c.opening_balance ?? 0,
  }))

  // Determine which cycle to show
  const selectedCycleId = params.cycle || currentCycleId
  const isCurrentCycle = selectedCycleId === currentCycleId

  // Fetch transactions for the selected cycle
  let cycleTransactions = rawTransactions
  if (!isCurrentCycle && selectedCycleId) {
    const txs = await getCycleTransactions(householdId, selectedCycleId)
    cycleTransactions = txs
  }

  // Build expense transactions with category names
  const expenseTransactions: ExpenseTransaction[] = (cycleTransactions || [])
    .filter((tx) => tx.transaction_type === "expense")
    .map((tx) => {
      const matchingCategory = categories.find((cat) => cat.id === tx.category_id)
      return {
        id: tx.id,
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        payment_account: tx.payment_account,
        description: tx.description || "",
        category_id: tx.category_id ?? null,
        category_name: matchingCategory ? matchingCategory.name : "General",
        created_at: tx.created_at ?? new Date().toISOString(),
        paid_by: tx.paid_by ?? null,
        counterparty_name: tx.counterparty_name ?? null,
        reimbursement_status: tx.reimbursement_status ?? null,
      }
    })

  // Get top 3 spending categories
  const topCategories = getTopCategories(expenseTransactions, categories)

  // Build category tabs
  const categoryTabs = [
    { id: "all", name: "All expenses" },
    ...topCategories.map((c) => ({ id: c.id, name: c.name })),
    { id: "reimbursements", name: "Reimbursements" },
  ]

  // ── Apply ALL filters from searchParams ───────────────────

  let filtered = [...expenseTransactions]

  // 1. Category filter (from tabs)
  const activeCategory = params.category || "all"
  if (activeCategory === "reimbursements") {
    filtered = filtered.filter((tx) => tx.paid_by === "someone_else")
  } else if (activeCategory !== "all") {
    filtered = filtered.filter((tx) => tx.category_id === activeCategory)
  }

  // 2. Payment source filter
  const activePayment = params.payment
  if (activePayment && activePayment !== "all") {
    filtered = filtered.filter((tx) => tx.payment_account === activePayment)
  }

  // 3. Search filter (description or counterparty)
  const searchQuery = params.search
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        (tx.counterparty_name?.toLowerCase() || "").includes(q) ||
        (tx.category_name?.toLowerCase() || "").includes(q)
    )
  }

  // 4. Sort
  const sortOption = params.sort || "date_newest"
  switch (sortOption) {
    case "date_oldest":
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case "amount_high_low":
      filtered.sort((a, b) => b.amount - a.amount)
      break
    case "amount_low_high":
      filtered.sort((a, b) => a.amount - b.amount)
      break
    case "pending_first":
      filtered.sort((a, b) => {
        const aPending = a.reimbursement_status === "pending" ? 1 : 0
        const bPending = b.reimbursement_status === "pending" ? 1 : 0
        return bPending - aPending || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      break
    default: // date_newest
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const groupedExpenses = groupByDay(filtered)

  // Stats (based on selected cycle)
  const selectedCycleExpenses = filtered.reduce((sum, tx) => sum + tx.amount, 0)
  const obligationCount = receivablesRecords.length + payablesRecords.length
  const velocityRatio = previousExpenses > 0 ? currentExpenses / previousExpenses : 0
  const isBurningFaster = velocityRatio > 1
  const totalLiquidity = cash + card
  const daysInCycle = monthlyCycle
    ? Math.max(1, Math.floor((Date.now() - new Date(monthlyCycle.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 30

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2d3436]">Expenses</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {monthlyCycle?.created_at
              ? new Date(monthlyCycle.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "No active cycle"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-sm transition-all">
            <Search size={18} strokeWidth={1.5} />
          </button>
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
      <ActionBar
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
        cashBalance={cash}
        cardBalance={card}
        initialCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Total Spend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <TrendingDown size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Total spend</span>
          </div>
          <p className="text-2xl font-bold text-[#e17055]">
            -Rs {selectedCycleExpenses.toLocaleString()}
          </p>
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

        {/* Pending Payables */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <Scale size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Pending payables</span>
          </div>
          <p className="text-2xl font-bold text-[#2d3436]">{payablesRecords.length}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>{receivablesRecords.length} receivable{receivablesRecords.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{payablesRecords.length} payable{payablesRecords.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Liquidity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <Wallet size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Liquidity</span>
          </div>
          <p className="text-2xl font-bold text-[#2d3436]">Rs {totalLiquidity.toLocaleString()}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>Cash: Rs {cash.toLocaleString()}</span>
            <span>·</span>
            <span>Card: Rs {card.toLocaleString()}</span>
          </div>
        </div>

        {/* Burn Rate */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <Clock size={14} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">Burn rate</span>
          </div>
          <p className="text-2xl font-bold text-[#2d3436]">
            Rs {Math.round(selectedCycleExpenses / Math.max(daysInCycle, 1)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-2">per day this cycle</p>
        </div>
      </div>

      {/* ── Filter Bar (Client Component with URL sync) ──────── */}
      <ExpensesFilterBar
        cycles={cycles}
        categories={categories}
        currentCycleId={currentCycleId}
        activeCategory={activeCategory}
        activePayment={activePayment || "all"}
        activeSort={sortOption}
        searchQuery={searchQuery || ""}
      />

      {/* ── Category Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mt-6 mb-6 w-fit">
        {categoryTabs.map((tab) => {
          const isActive = activeCategory === tab.id
          return (
            <Link
              key={tab.id}
              href={`/dashboard/expenses?${buildQueryString({ ...params, category: tab.id === "all" ? undefined : tab.id })}`}
              scroll={false}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-[#2d3436] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </div>

      {/* ── Expense List Grouped by Day ──────────────────────── */}
      <div className="space-y-6">
        {groupedExpenses.map((day) => (
          <div key={day.date}>
            {/* Date Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-[#2d3436]">{day.label}</h3>
              <span className="text-sm font-medium text-[#e17055]">
                -Rs {day.dayTotal.toLocaleString()}
              </span>
            </div>

            {/* Transaction Cards */}
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
              {day.transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i !== day.transactions.length - 1 ? "border-b border-gray-50" : ""
                  } hover:bg-gray-50/50 transition-colors cursor-pointer group`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${getCategoryColor(tx.category_name)} 15%, transparent)`,
                        color: getCategoryColor(tx.category_name),
                      }}
                    >
                      {getCategoryIcon(tx.category_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2d3436]">
                        {tx.description || tx.category_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">
                          {tx.category_name}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400 capitalize">
                          {tx.payment_account}
                        </span>
                        {tx.reimbursement_status === "pending" && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                              Pending
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#2d3436] tabular-nums">
                      -Rs {tx.amount.toLocaleString()}
                    </span>
                    <ChevronRight
                      size={16}
                      strokeWidth={1.5}
                      className="text-gray-300 group-hover:text-gray-500 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedExpenses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <TrendingDown size={24} strokeWidth={1.5} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">
              {activeCategory === "all" && !searchQuery
                ? "No expenses recorded this cycle"
                : "No expenses match your filters"}
            </p>
            {(activeCategory !== "all" || searchQuery) && (
              <Link
                href="/dashboard/expenses"
                className="inline-block mt-3 text-sm text-[#8b9dc3] hover:text-[#6c7a95] transition-colors"
              >
                Clear all filters
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Query String Builder ────────────────────────────────────

function buildQueryString(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`).join("&")
}

// ── Category Helpers ────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  groceries: "#8b9dc3",
  dining: "#e17055",
  transport: "#fdcb6e",
  utilities: "#6c5ce7",
  shopping: "#00b894",
  entertainment: "#e84393",
  health: "#00cec9",
  education: "#0984e3",
  general: "#b2bec3",
}

function getCategoryColor(categoryName: string = "General"): string {
  return CATEGORY_COLORS[categoryName.toLowerCase()] || CATEGORY_COLORS["general"]
}

function getCategoryIcon(categoryName: string = "General") {
  const name = categoryName.toLowerCase()
  const icons: Record<string, JSX.Element> = {
    groceries: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
      </svg>
    ),
    dining: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2"/><path d="M18 22v-5.5a2.5 2.5 0 0 0-5 0V22"/><path d="M13 22h10"/><path d="M18 9a2.5 2.5 0 0 0-5 0V13"/>
      </svg>
    ),
    transport: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
      </svg>
    ),
    utilities: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
      </svg>
    ),
    shopping: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    ),
    entertainment: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
    health: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    education: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
      </svg>
    ),
  }
  return icons[name] || (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>
    </svg>
  )
}