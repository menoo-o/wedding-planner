// app/dashboard/expenses/page.tsx
"use client"

import { useState } from "react"
import styles from "./expenses.module.css"

// ─── Types ───────────────────────────────────────────────────────

type StatItem = {
  label: string
  value: string
  valueSuffix?: string
  sub: string
  subClass: string
  icon: string
}

type Transaction = {
  id: number
  icon: string
  name: string
  detail: string
  payment: string
  by: string
  status: string
  statusClass: string
  amount: string
  time: string
}

type BreakdownItem = {
  label: string
  pct: number
  barClass: string
}

// ─── Data ────────────────────────────────────────────────────────

const STATS: StatItem[] = [
  {
    label: "Liquidity",
    value: "$142,850",
    sub: "+2.4% vs last mo",
    subClass: styles.subGreen,
    icon: "trending_up",
  },
  {
    label: "Net Position",
    value: "$894,000",
    sub: "Portfolio Alpha",
    subClass: styles.subMuted,
    icon: "donut_small",
  },
  {
    label: "Total Spend",
    value: "$12,410",
    sub: "-0.8% vs last mo",
    subClass: styles.subRed,
    icon: "trending_down",
  },
  {
    label: "Burn Rate",
    value: "$410",
    valueSuffix: "/day",
    sub: "Within Budget",
    subClass: styles.subGreen,
    icon: "check_circle",
  },
]

const TABS = ["All Expenses", "Groceries", "Fuel", "Utilities", "Reimbursements"]

const TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    icon: "computer",
    name: "Apple Store",
    detail: "Hardware Upgrade • 14 Oct, 2023",
    payment: "Apple Pay",
    by: "Alex M.",
    status: "COMPLETED",
    statusClass: styles.statusCompleted,
    amount: "-$1,299.00",
    time: "10:45 AM",
  },
  {
    id: 2,
    icon: "shopping_cart",
    name: "Amazon.com",
    detail: "Office Supplies • 13 Oct, 2023",
    payment: "Corporate Visa",
    by: "Household",
    status: "PROCESSING",
    statusClass: styles.statusProcessing,
    amount: "-$84.20",
    time: "15:30 PM",
  },
  {
    id: 3,
    icon: "coffee",
    name: "Starbucks",
    detail: "Team Coffee • 12 Oct, 2023",
    payment: "Cash",
    by: "Alex M.",
    status: "COMPLETED",
    statusClass: styles.statusCompleted,
    amount: "-$18.50",
    time: "08:12 AM",
  },
  {
    id: 4,
    icon: "home",
    name: "Metropolis Realty",
    detail: "Monthly Rent • 01 Oct, 2023",
    payment: "Direct Debit",
    by: "Household",
    status: "COMPLETED",
    statusClass: styles.statusCompleted,
    amount: "-$3,200.00",
    time: "00:01 AM",
  },
]

const BREAKDOWN: BreakdownItem[] = [
  { label: "Travel & Logistics", pct: 45, barClass: styles.barPrimary },
  { label: "Services & Subs",    pct: 28, barClass: styles.barSecondary },
  { label: "Utilities",          pct: 15, barClass: styles.barTertiary },
  { label: "Others",             pct: 12, barClass: styles.barOther },
]

// ─── Component ───────────────────────────────────────────────────

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("All Expenses")

  return (
    <div className={styles.page}>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{s.value}</span>
              {s.valueSuffix && (
                <span className={styles.statSuffix}>{s.valueSuffix}</span>
              )}
            </div>
            <div className={`${styles.statSub} ${s.subClass}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
              <span>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main body ──────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Transaction list */}
        <div className={styles.transactions}>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <button className={styles.monthBtn}>
              <span className="material-symbols-outlined">calendar_month</span>
              This Month
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>

          {/* Rows */}
          <div className={styles.rows}>
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className={styles.row}>

                <div className={styles.rowIcon}>
                  <span className="material-symbols-outlined">{tx.icon}</span>
                </div>

                <div className={styles.rowInfo}>
                  <p className={styles.rowName}>{tx.name}</p>
                  <p className={styles.rowDetail}>{tx.detail}</p>
                </div>

                <div className={styles.rowMeta}>
                  <div className={styles.metaBlock}>
                    <p className={styles.metaLabel}>Payment</p>
                    <p className={styles.metaValue}>{tx.payment}</p>
                  </div>
                  <div className={styles.metaBlock}>
                    <p className={styles.metaLabel}>By</p>
                    <p className={styles.metaValue}>{tx.by}</p>
                  </div>
                  <div className={styles.metaBlock}>
                    <p className={styles.metaLabel}>Status</p>
                    <p className={`${styles.metaStatus} ${tx.statusClass}`}>{tx.status}</p>
                  </div>
                </div>

                <div className={styles.rowAmount}>
                  <p className={styles.rowAmountValue}>{tx.amount}</p>
                  <p className={styles.rowAmountTime}>{tx.time}</p>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* ── Right sidebar ────────────────────────────────────── */}
        <aside className={styles.sidebar}>

          {/* Spending Breakdown */}
          <div className={styles.breakdown}>
            <div className={styles.breakdownHeader}>
              <p className={styles.breakdownTitle}>Spending Breakdown</p>
              <span className={`${styles.breakdownMore} material-symbols-outlined`}>more_horiz</span>
            </div>

            <div className={styles.bars}>
              {BREAKDOWN.map((b) => (
                <div key={b.label} className={styles.barRow}>
                  <div className={styles.barLabelRow}>
                    <span>{b.label}</span>
                    <span>{b.pct}%</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${b.barClass}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className={styles.breakdownInsight}>
              &ldquo;You&apos;ve spent <strong>12% less</strong> on Utilities than last month.
              Keep up the high efficiency.&rdquo;
            </p>
          </div>

          {/* Quick Upload */}
          <div className={styles.upload}>
            <div className={styles.uploadIcon}>
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <p className={styles.uploadTitle}>Quick Upload</p>
            <p className={styles.uploadSub}>Drag receipts here to auto-process with AI</p>
            <button className={styles.uploadBtn}>Browse Files</button>
          </div>

        </aside>
      </div>
    </div>
  )
}