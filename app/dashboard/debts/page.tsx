// app/dashboard/debts/page.tsx
import { Suspense } from "react"
import { getDashboardData } from "@/app/dashboard/_services/dashboard"
import { getActiveReceivables, getActivePayables } from "@/app/dashboard/_db/transactions"
import MoneyManagerView, {
  type LedgerItem,
  type HistoryItem,
  type ChartBucket,
} from "@/app/dashboard/components/debts/MoneyManagerView"

export default function DebtsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <FetchMoneyManagerData />
    </Suspense>
  )
}

async function FetchMoneyManagerData() {
  const {
    householdMember,
    monthlyCycle,
    cash,
    card,
    total,
    rawTransactions,
  } = await getDashboardData()

  if (!householdMember) {
    return (
      <div className="mm-empty-state">
        <p>No active household membership found.</p>
      </div>
    )
  }

  const householdId = householdMember.household_id
  const currentCycleId = monthlyCycle?.id ?? ""

  // ── Fetch receivables + payables in parallel ─────────────────
  const [receivablesRecords, payablesData] = await Promise.all([
    getActiveReceivables(householdId, currentCycleId),
    getActivePayables(householdId),
  ])

  // payablesData mixes two concerns — split by transaction_type:
  // loan_in rows are true "payables" (you borrowed cash),
  // expense rows are "reimbursements" (someone else paid a bill for you).
  const payablesLoans   = payablesData.filter((p) => p.transaction_type === "loan_in")
  const reimbursements  = payablesData.filter((p) => p.transaction_type === "expense")

  // ── Normalize each bucket into a common LedgerItem shape ─────
  const receivableItems: LedgerItem[] = receivablesRecords.map((r) => ({
    id: r.id,
    partyName: r.counterparty_name ?? "Unknown",
    description: r.description ?? "Lent funds",
    amount: r.amount,
    remaining: r.remaining_amount,
    date: r.created_at,
    status: r.loan_status,
    kind: "receivable",
  }))

  const payableItems: LedgerItem[] = payablesLoans.map((p) => ({
    id: p.id,
    partyName: p.counterparty_name ?? "Unknown",
    description: p.description ?? "Borrowed funds",
    amount: p.amount,
    remaining: p.remaining_amount,
    date: p.created_at,
    status: p.loan_status ?? "pending",
    kind: "payable",
  }))

  const reimbursementItems: LedgerItem[] = reimbursements.map((p) => ({
    id: p.id,
    partyName: p.counterparty_name ?? "Unknown",
    description: p.description ?? "Paid expense",
    amount: p.amount,
    remaining: p.remaining_amount,
    date: p.created_at,
    status: p.reimbursement_status ?? "pending",
    kind: "reimbursement",
  }))

  // ── KPI totals ─────────────────────────────────────────────
  const totalReceivables    = sumRemaining(receivableItems)
  const totalPayables       = sumRemaining(payableItems)
  const totalReimbursements = sumRemaining(reimbursementItems)
  const totalLiquidity      = total // cash + card, from getDashboardData

  // Net position: what you hold, plus what's owed to you,
  // minus what you owe out, minus pending reimbursements you're due to pay back.
  const netPosition = totalLiquidity + totalReceivables - totalPayables - totalReimbursements

  // Liquidity coverage: what % of your outstanding obligations
  // your current cash/card balance could cover right now.
  const obligations = totalPayables + totalReimbursements
  const liquidityCoverage = obligations > 0
    ? Math.min(100, (totalLiquidity / obligations) * 100)
    : 100

  // ── History — every transaction in the active cycle, newest first ─
  const historyItems: HistoryItem[] = (rawTransactions ?? [])
    .map((tx) => ({
      id: tx.id,
      partyName: tx.counterparty_name ?? "—",
      description: tx.description ?? "",
      amount: tx.amount,
      date: tx.created_at ?? new Date().toISOString(),
      type: tx.transaction_type,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // ── Cashflow trend — expenses bucketed by week within the cycle ──
  const chartData = buildWeeklyExpenseChart(rawTransactions ?? [])

  // ── Audit context for the side panel ──────────────────────────
  const latestEntry = historyItems[0] ?? null
  const cycleLabel =
    monthlyCycle?.year != null &&
    monthlyCycle?.month != null
      ? new Date(
          monthlyCycle.year,
          monthlyCycle.month - 1
        ).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "No active cycle"

  return (
    <MoneyManagerView
      cycleLabel={cycleLabel}
      cycleOpen={monthlyCycle ? !monthlyCycle.is_closed : false}
      householdRole={householdMember.role}
      kpis={{
        receivables: totalReceivables,
        payables: totalPayables,
        reimbursements: totalReimbursements,
        netPosition,
        liquidityCoverage,
        pendingReimbursementCount: reimbursementItems.filter((r) => r.status !== "settled").length,
        pendingNotificationsCount:
          receivableItems.filter((r) => r.status !== "settled").length +
          payableItems.filter((r) => r.status !== "settled").length +
          reimbursementItems.filter((r) => r.status !== "settled").length,
      }}
      receivables={receivableItems}
      payables={payableItems}
      reimbursements={reimbursementItems}
      history={historyItems}
      chartData={chartData}
      latestEntry={latestEntry}
    />
  )
}

// ── Helpers ─────────────────────────────────────────────────────

function sumRemaining(items: LedgerItem[]) {
  return items.reduce((sum, i) => sum + i.remaining, 0)
}

function buildWeeklyExpenseChart(
  txs: { transaction_type: string; amount: number; created_at?: string | null  }[]
): ChartBucket[] {
  const buckets = new Map<string, { label: string; value: number; sortKey: number }>()

  txs
    .filter((tx) => tx.transaction_type === "expense" && tx.created_at)
    .forEach((tx) => {
      const date = new Date(tx.created_at as string)
      // Monday of that transaction's week, used as the bucket key
      const weekStart = new Date(date)
      const dayOffset = (date.getDay() + 6) % 7 // Mon=0 ... Sun=6
      weekStart.setDate(date.getDate() - dayOffset)
      const key = weekStart.toISOString().split("T")[0]

      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const existing = buckets.get(key)
      buckets.set(key, {
        label,
        value: (existing?.value ?? 0) + tx.amount,
        sortKey: weekStart.getTime(),
      })
    })
    return Array.from(buckets.entries())
  .sort(([, a], [, b]) => a.sortKey - b.sortKey)
  .slice(-7)
  .map(([key, bucket]) => ({
    key,
    label: bucket.label,
    value: bucket.value,
  }))
}


  // ── Skeleton ──────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="mm-skeleton">
      <div className="mm-skeleton-bar" />
      <div className="mm-skeleton-grid">
        <div className="mm-skeleton-card" />
        <div className="mm-skeleton-card" />
        <div className="mm-skeleton-card" />
        <div className="mm-skeleton-card mm-skeleton-card--dark" />
      </div>
      <div className="mm-skeleton-table" />
    </div>
  )
}