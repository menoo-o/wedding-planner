// app/dashboard/debts/MoneyManagerView.tsx
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import "./debts.css"

// ── Shared types (also imported by page.tsx) ───────────────────

export type LedgerStatus = "pending" | "partial" | "settled"

export interface LedgerItem {
  id: string
  partyName: string
  description: string
  amount: number
  remaining: number
  date: string
  status: LedgerStatus
  kind: "receivable" | "payable" | "reimbursement"
}

export interface HistoryItem {
  id: string
  partyName: string
  description: string
  amount: number
  date: string
  type: string
}

export interface ChartBucket {
  label: string
  value: number
}

type TabKey = "overview" | "receivables" | "payables" | "reimbursements" | "history"

interface MoneyManagerViewProps {
  cycleLabel: string
  cycleOpen: boolean
  householdRole: string
  kpis: {
    receivables: number
    payables: number
    reimbursements: number
    netPosition: number
    liquidityCoverage: number
    pendingReimbursementCount: number
    pendingNotificationsCount: number
  }
  receivables: LedgerItem[]
  payables: LedgerItem[]
  reimbursements: LedgerItem[]
  history: HistoryItem[]
  chartData: ChartBucket[]
  latestEntry: HistoryItem | null
}

// ── Formatting helpers ──────────────────────────────────────────

const fmt = (val: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", minimumFractionDigits: 0,
  }).format(val)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ────────────────────────────────────────────────

export default function MoneyManagerView({
  cycleLabel,
  cycleOpen,
  householdRole,
  kpis,
  receivables,
  payables,
  reimbursements,
  history,
  chartData,
  latestEntry,
}: MoneyManagerViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | LedgerStatus>("all")

  // ── Build the merged Overview feed (unsettled items first, newest first) ──
  const overviewItems = useMemo(() => {
    const merged = [...receivables, ...payables, ...reimbursements]
    return merged.sort((a, b) => {
      const aOpen = a.status !== "settled"
      const bOpen = b.status !== "settled"
      if (aOpen !== bOpen) return aOpen ? -1 : 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [receivables, payables, reimbursements])

  const tabSource: Record<TabKey, LedgerItem[]> = {
    overview: overviewItems,
    receivables,
    payables,
    reimbursements,
    history: [], // history uses its own renderer
  }

  // ── Apply search + status filter to the active ledger tab ──────
  const filteredLedger = useMemo(() => {
    if (activeTab === "history") return []
    return tabSource[activeTab].filter((item) => {
      const matchesSearch =
        search.trim() === "" ||
        item.partyName.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [activeTab, tabSource, search, statusFilter])

  const filteredHistory = useMemo(() => {
    if (activeTab !== "history") return []
    if (search.trim() === "") return history
    return history.filter(
      (h) =>
        h.partyName.toLowerCase().includes(search.toLowerCase()) ||
        h.description.toLowerCase().includes(search.toLowerCase()) ||
        h.type.toLowerCase().includes(search.toLowerCase())
    )
  }, [activeTab, history, search])

  const handleExport = () => {
    if (activeTab === "history") {
      downloadCsv(
        "transaction-history.csv",
        filteredHistory.map((h) => ({
          date: fmtDate(h.date), type: h.type, party: h.partyName,
          description: h.description, amount: h.amount,
        }))
      )
    } else {
      downloadCsv(
        `${activeTab}.csv`,
        filteredLedger.map((i) => ({
          date: fmtDate(i.date), party: i.partyName, description: i.description,
          status: i.status, amount: i.amount, remaining: i.remaining,
        }))
      )
    }
  }

  const maxChartValue = Math.max(1, ...chartData.map((b) => b.value))

  return (
    <div className="mm-shell">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="mm-sidebar">
        <div className="mm-brand">
          <span className="mm-brand-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 10l9-6 9 6M5 10v9h14v-9M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <div>
            <p className="mm-brand-title">Money Manager</p>
            <p className="mm-brand-sub">{cycleLabel}</p>
          </div>
        </div>

        <nav className="mm-nav">
          <Link href="/dashboard" className="mm-nav-item mm-nav-item--active">
            <NavIcon name="dashboard" />
            <span>Dashboard</span>
          </Link>
          <button type="button" className="mm-nav-item mm-nav-item--disabled" title="Coming soon" disabled>
            <NavIcon name="ledger" />
            <span>Ledger</span>
          </button>
          <button type="button" className="mm-nav-item mm-nav-item--disabled" title="Coming soon" disabled>
            <NavIcon name="members" />
            <span>Members</span>
          </button>
          <button type="button" className="mm-nav-item mm-nav-item--disabled" title="Coming soon" disabled>
            <NavIcon name="insights" />
            <span>Insights</span>
          </button>
        </nav>

        <div className="mm-profile">
          <span className="mm-profile-avatar" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
          <div>
            <p className="mm-profile-name">Household {capitalize(householdRole)}</p>
            <p className="mm-profile-sub">{cycleOpen ? "Cycle open" : "Cycle closed"}</p>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="mm-main">

        {/* Header */}
        <header className="mm-header">
          <div className="mm-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search ledger or transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search ledger or transactions"
            />
          </div>

          <div className="mm-header-actions">
            <button type="button" className="mm-icon-btn" title="Notifications" aria-label="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M6 9a6 6 0 1112 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M9.5 20a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              {kpis.pendingNotificationsCount > 0 && (
                <span className="mm-icon-badge">{kpis.pendingNotificationsCount}</span>
              )}
            </button>
            <button type="button" className="mm-icon-btn" title="Settings" aria-label="Settings">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M19.4 13a1.7 1.7 0 000-2l1-1.7-1.7-1.7-1.7 1a1.7 1.7 0 00-2-1l-.4-2h-2.4l-.4 2a1.7 1.7 0 00-2 1l-1.7-1L6.6 9.3l1 1.7a1.7 1.7 0 000 2l-1 1.7 1.7 1.7 1.7-1a1.7 1.7 0 002 1l.4 2h2.4l.4-2a1.7 1.7 0 002-1l1.7 1 1.7-1.7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
            <Link href="/dashboard" className="mm-cta">
              <span aria-hidden="true">+</span> New Entry
            </Link>
          </div>
        </header>

        {/* KPI cards */}
        <section className="mm-kpis">
          <KpiCard label="Receivables" value={fmt(kpis.receivables)} hint={`${receivables.filter(r => r.status !== "settled").length} active`} arrow="down-left" />
          <KpiCard label="Payables" value={fmt(kpis.payables)} hint={`${payables.filter(p => p.status !== "settled").length} active`} arrow="up-right" />
          <KpiCard label="Reimbursements" value={fmt(kpis.reimbursements)} hint={`Pending ${kpis.pendingReimbursementCount} approval${kpis.pendingReimbursementCount === 1 ? "" : "s"}`} arrow="transfer" />
          <div className="mm-kpi mm-kpi--dark">
            <div className="mm-kpi-top">
              <span className="mm-kpi-label">Net Position</span>
              <span className="mm-kpi-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </span>
            </div>
            <p className="mm-kpi-value">{fmt(kpis.netPosition)}</p>
            <div className="mm-coverage-track">
              <div className="mm-coverage-fill" style={{ width: `${kpis.liquidityCoverage}%` }} />
            </div>
            <p className="mm-kpi-footnote">{kpis.liquidityCoverage.toFixed(0)}% of obligations covered by liquidity</p>
          </div>
        </section>

        {/* Tabs + table */}
        <section className="mm-panel">
          <div className="mm-tabs-row">
            <div className="mm-tabs">
              {(["overview", "receivables", "payables", "reimbursements", "history"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`mm-tab ${activeTab === tab ? "mm-tab--active" : ""}`}
                  onClick={() => { setActiveTab(tab); setStatusFilter("all") }}
                >
                  {capitalize(tab)}
                </button>
              ))}
            </div>

            <div className="mm-tools">
              {activeTab !== "history" && (
                <select
                  className="mm-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | LedgerStatus)}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="settled">Settled</option>
                </select>
              )}
              <button type="button" className="mm-export" onClick={handleExport}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12M7 11l5 5 5-5M5 21h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          <div className="mm-table-wrap">
            {activeTab === "history" ? (
              <HistoryTable rows={filteredHistory} />
            ) : (
              <LedgerTable rows={filteredLedger} showKind={activeTab === "overview"} />
            )}
          </div>
        </section>

        {/* Chart + side panel */}
        <section className="mm-bottom-grid">
          <div className="mm-chart-card">
            <div className="mm-chart-bars">
              {chartData.length === 0 ? (
                <p className="mm-chart-empty">No expense activity yet this cycle.</p>
              ) : (
             chartData.map((bucket, index) => (
              <div
                className="mm-chart-col"
                key={`${bucket.label}-${index}`}
              >
                    <div
                      className={`mm-chart-bar ${bucket.value === maxChartValue ? "mm-chart-bar--peak" : ""}`}
                      style={{ height: `${Math.max(6, (bucket.value / maxChartValue) * 100)}%` }}
                      title={fmt(bucket.value)}
                    />
                    <span className="mm-chart-label">{bucket.label}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mm-chart-caption">
              <h4>Cashflow Trend</h4>
              <p>Weekly expense totals for the active cycle, most recent weeks first.</p>
            </div>
          </div>

          <div className="mm-side-card">
            <h4>Cycle & Activity</h4>
            <ul className="mm-log-list">
              <li>
                <span className="mm-log-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <p className="mm-log-title">Active cycle</p>
                  <p className="mm-log-sub">{cycleLabel} &middot; {cycleOpen ? "Open" : "Closed"}</p>
                </div>
              </li>
              <li>
                <span className="mm-log-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                </span>
                <div>
                  <p className="mm-log-title">Last entry</p>
                  <p className="mm-log-sub">
                    {latestEntry
                      ? `${fmtDate(latestEntry.date)} · ${latestEntry.description || capitalize(latestEntry.type)}`
                      : "No activity yet"}
                  </p>
                </div>
              </li>
              <li>
                <span className="mm-log-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <p className="mm-log-title">Your role</p>
                  <p className="mm-log-sub">{capitalize(householdRole)}</p>
                </div>
              </li>
            </ul>
            <button type="button" className="mm-audit-btn" onClick={() => setActiveTab("history")}>
              View Full History
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────

function KpiCard({
  label, value, hint, arrow,
}: { label: string; value: string; hint: string; arrow: "down-left" | "up-right" | "transfer" }) {
  return (
    <div className="mm-kpi">
      <div className="mm-kpi-top">
        <span className="mm-kpi-label">{label}</span>
        <span className="mm-kpi-icon" aria-hidden="true">
          {arrow === "down-left" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 8v10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
          {arrow === "up-right" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M8 6h10v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
          {arrow === "transfer" && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 7h13l-3-3M20 17H7l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </span>
      </div>
      <p className="mm-kpi-value">{value}</p>
      <p className="mm-kpi-footnote">{hint}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: LedgerStatus }) {
  return <span className={`mm-status mm-status--${status}`}>{capitalize(status)}</span>
}

function LedgerTable({ rows, showKind }: { rows: LedgerItem[]; showKind: boolean }) {
  if (rows.length === 0) {
    return <div className="mm-empty">No matching records for this view.</div>
  }
  return (
    <table className="mm-table">
      <thead>
        <tr>
          <th>Party</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Status</th>
          <th className="mm-num">Rem. Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <div className="mm-party">
                <span className="mm-avatar">{initials(row.partyName)}</span>
                <div>
                  <p className="mm-party-name">
                    {row.partyName}
                    {showKind && <span className="mm-kind-tag">{kindLabel(row.kind)}</span>}
                  </p>
                  <p className="mm-party-desc">{row.description}</p>
                </div>
              </div>
            </td>
            <td className="mm-amount">{fmt(row.amount)}</td>
            <td className="mm-muted">{fmtDate(row.date)}</td>
            <td><StatusBadge status={row.status} /></td>
            <td className="mm-num">
              <span className={row.status === "settled" ? "mm-muted" : "mm-remaining"}>
                {fmt(row.remaining)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function HistoryTable({ rows }: { rows: HistoryItem[] }) {
  if (rows.length === 0) {
    return <div className="mm-empty">No transactions recorded yet this cycle.</div>
  }
  return (
    <table className="mm-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Party</th>
          <th>Description</th>
          <th className="mm-num">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="mm-muted">{fmtDate(row.date)}</td>
            <td><span className="mm-type-tag">{row.type.replace("_", " ")}</span></td>
            <td className="mm-party-name">{row.partyName}</td>
            <td className="mm-party-desc">{row.description || "—"}</td>
            <td className="mm-num mm-amount">{fmt(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function NavIcon({ name }: { name: "dashboard" | "ledger" | "members" | "insights" }) {
  const paths: Record<string, JSX.Element> = {
    dashboard: <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zm0 7h7v9h-7v-9zM4 13h7v7H4v-7z" />,
    ledger: <path d="M5 4h11l3 3v13H5V4zm4 6h7M9 13h7M9 16h4" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round"/>,
    members: <path d="M9 12a3 3 0 100-6 3 3 0 000 6zm7-1a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.5.3 4.5 2.4 4.5 5.5" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>,
    insights: <path d="M4 19V10M11 19V5M18 19v-7" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"/>,
  }
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

// ── Small utils ──────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function kindLabel(kind: LedgerItem["kind"]) {
  if (kind === "receivable") return "Owed to you"
  if (kind === "payable") return "You owe"
  return "Reimbursement"
}