// app/dashboard/_db/debt.ts

import { cache } from "react"
import { createClient } from "@/utils/supabase/server"

// ── Strict Domain Types ─────────────────────────────────────────

export type LoanStatus = "pending" | "partial" | "settled"
export type PaymentAccount = "cash" | "card" | "personal"
export type DebtDirection = "you_owe" | "you_are_owed"

export interface DebtInstallment {
  id: string
  created_at: string
  amount: number
  payment_account: "cash" | "card"
  notes: string | null
  related_transaction_id: string
}

export interface ParsedDebtItem {
  id: string
  counterparty: string
  initials: string
  description: string
  notes: string | null
  direction: DebtDirection // "you_owe" = payable, "you_are_owed" = receivable
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  remainingPercentage: number
  isSettled: boolean
  status: LoanStatus
  dueBadgeText: string | null // e.g. "Due Aug 28, 2026 · 3 days ago"
  createdAtFormatted: string
  rawCreatedAt: string
  installments: DebtInstallment[]
}

export interface MonthDebtsGroup {
  monthYearLabel: string // e.g. "September 2026"
  previousMonthLabel: string // e.g. "August"
  openCount: number
  needsAttention: ParsedDebtItem[]
  settled: ParsedDebtItem[]
}

export interface PersonRollupItem {
  name: string
  initials: string
  netBalance: number
  direction: DebtDirection
  openItemsCount: number
}

export interface DebtsPageStats {
  netDebtPosition: number
  totalReceivables: number
  totalPayables: number
  clearedThisMonth: number
  receivablesPeopleCount: number
  payablesPeopleCount: number
}

export interface DebtsPageData {
  groups: MonthDebtsGroup[] // Chronological monthly buckets
  activeMonthGroup: MonthDebtsGroup // Current cycle month
  peopleRollup: PersonRollupItem[]
  stats: DebtsPageStats
}

// ── Database Row Shapes (Strict Supabase response) ─────────────

interface TransactionParentRow {
  id: string
  created_at: string
  transaction_type: string
  amount: number | string | null
  counterparty_name: string | null
  description: string | null
  paid_by: string | null
  loan_status: string | null
  reimbursement_status: string | null
  payment_account: string | null
  notes: string | null
}

interface TransactionChildRow {
  id: string
  created_at: string
  amount: number | string | null
  payment_account: string | null
  notes: string | null
  related_transaction_id: string | null
}

// ── Internal Pure Helpers ──────────────────────────────────────

function roundCurrency(val: number): number {
  return Math.round(val * 100) / 100
}

export function getCounterpartyInitials(name: string): string {
  const clean = name.trim()
  if (!clean || clean.toLowerCase() === "unknown") return "UN"
  const parts = clean.split(/[\s-]+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

function formatRelativeDue(dateString: string): string {
  const target = new Date(dateString)
  if (isNaN(target.getTime())) return ""

  const now = new Date()
  const diffDays = Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  const formattedDate = target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  if (diffDays === 0) return `Due today`
  if (diffDays === 1) return `Due ${formattedDate} · yesterday`
  if (diffDays > 1) return `Due ${formattedDate} · ${diffDays} days ago`
  return `Due ${formattedDate}`
}

function getPreviousMonthName(date: Date): string {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  return prev.toLocaleDateString("en-US", { month: "long" })
}

// ── In-Memory Prefetch & Normalizer ─────────────────────────────

export const getDebtsPageData = cache(
  async (householdId: string): Promise<DebtsPageData> => {
    const emptyMonth: MonthDebtsGroup = {
      monthYearLabel: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      previousMonthLabel: getPreviousMonthName(new Date()),
      openCount: 0,
      needsAttention: [],
      settled: [],
    }

    if (!householdId) {
      return {
        groups: [emptyMonth],
        activeMonthGroup: emptyMonth,
        peopleRollup: [],
        stats: {
          netDebtPosition: 0,
          totalReceivables: 0,
          totalPayables: 0,
          clearedThisMonth: 0,
          receivablesPeopleCount: 0,
          payablesPeopleCount: 0,
        },
      }
    }

    const supabase = await createClient()

    // 1. Parallel fetch: Root obligations + Child installment settlements
    const [parentsRes, childrenRes] = await Promise.all([
      supabase
        .from("transactions")
        .select(`
          id,
          created_at,
          transaction_type,
          amount,
          counterparty_name,
          description,
          paid_by,
          loan_status,
          reimbursement_status,
          payment_account,
          notes
        `)
        .eq("household_id", householdId)
        .or(
          "transaction_type.in.(loan_in,loan_out),and(transaction_type.eq.expense,paid_by.eq.someone_else)"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("transactions")
        .select(`
          id,
          created_at,
          amount,
          payment_account,
          notes,
          related_transaction_id
        `)
        .eq("household_id", householdId)
        .in("transaction_type", ["loan_return", "settlement"])
        .not("related_transaction_id", "is", null)
        .order("created_at", { ascending: true }),
    ])

    if (parentsRes.error) {
      console.error("Failed to fetch debts data:", parentsRes.error.message)
      throw parentsRes.error
    }

    const rawParents = (parentsRes.data ?? []) as TransactionParentRow[]
    const rawChildren = (childrenRes.data ?? []) as TransactionChildRow[]

    // 2. Index repayments by parent ID
    const installmentsMap = new Map<string, DebtInstallment[]>()
    for (const child of rawChildren) {
      if (!child.related_transaction_id) continue
      const existing = installmentsMap.get(child.related_transaction_id) ?? []
      existing.push({
        id: child.id,
        created_at: child.created_at,
        amount: roundCurrency(Number(child.amount) || 0),
        payment_account: child.payment_account === "card" ? "card" : "cash",
        notes: child.notes ?? null,
        related_transaction_id: child.related_transaction_id,
      })
      installmentsMap.set(child.related_transaction_id, existing)
    }

    // 3. Map into UI domain shape
    const allParsedItems: ParsedDebtItem[] = rawParents.map((parent) => {
      const installments = installmentsMap.get(parent.id) ?? []
      const totalPaid = roundCurrency(
        installments.reduce((sum, item) => sum + item.amount, 0)
      )
      const originalAmount = roundCurrency(Number(parent.amount) || 0)
      const remainingAmount = roundCurrency(Math.max(0, originalAmount - totalPaid))

      // Direction: loan_out = we lent money (you_are_owed), else we borrowed (you_owe)
      const isReceivable = parent.transaction_type === "loan_out"
      const direction: DebtDirection = isReceivable ? "you_are_owed" : "you_owe"

      // Settlement resolution
      const isSettled =
        remainingAmount <= 0 ||
        parent.loan_status === "settled" ||
        parent.reimbursement_status === "settled"

      const status: LoanStatus = isSettled
        ? "settled"
        : totalPaid > 0
        ? "partial"
        : "pending"

      // Calculate percentage remaining (0% to 100%)
      const remainingPercentage =
        originalAmount > 0
          ? Math.min(100, Math.max(0, Math.round((remainingAmount / originalAmount) * 100)))
          : 0

      const counterparty = parent.counterparty_name?.trim() || "Unknown"
      const defaultDesc =
        parent.transaction_type === "expense"
          ? "Expense reimbursement"
          : isReceivable
          ? `Lent to ${counterparty}`
          : `Borrowed from ${counterparty}`

      const createdDate = new Date(parent.created_at)
      const createdAtFormatted = !isNaN(createdDate.getTime())
        ? createdDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : ""

      return {
        id: parent.id,
        counterparty,
        initials: getCounterpartyInitials(counterparty),
        description: parent.description?.trim() || defaultDesc,
        notes: parent.notes ?? null,
        direction,
        totalAmount: originalAmount,
        paidAmount: totalPaid,
        remainingAmount,
        remainingPercentage,
        isSettled,
        status,
        dueBadgeText: isSettled ? null : formatRelativeDue(parent.created_at),
        createdAtFormatted,
        rawCreatedAt: parent.created_at,
        installments,
      }
    })

    // 4. Partition items by Month Year Bucket
    // ── 4. Partition items by Month Year Bucket (Descending) ──
    const monthsMap = new Map<string, { dateObj: Date; items: ParsedDebtItem[] }>()

    // ALWAYS ensure the current active calendar month exists at the top
    const now1 = new Date()
    const activeCurrentMonthDate = new Date(now1.getFullYear(), now1.getMonth(), 1)
    const activeCurrentMonthLabel = activeCurrentMonthDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })

    // Seed current month
    monthsMap.set(activeCurrentMonthLabel, {
      dateObj: activeCurrentMonthDate,
      items: [],
    })

    // Group all parsed transactions into their respective month buckets
    for (const item of allParsedItems) {
      const d = new Date(item.rawCreatedAt)
      if (isNaN(d.getTime())) continue

      const bucketDate = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthKey = bucketDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })

      const existing = monthsMap.get(monthKey)
      if (existing) {
        existing.items.push(item)
      } else {
        monthsMap.set(monthKey, {
          dateObj: bucketDate,
          items: [item],
        })
      }
    }

    // Sort chronologically descending: Latest month (September 2026) -> August -> July
    const sortedMonthEntries = Array.from(monthsMap.entries()).sort(
      (a, b) => b[1].dateObj.getTime() - a[1].dateObj.getTime()
    )

    const groups: MonthDebtsGroup[] = sortedMonthEntries.map(([label, data], idx) => {
      const needsAttention = data.items.filter((d) => !d.isSettled)
      const settled = data.items.filter((d) => d.isSettled)

      // Calculate previous month name for the pagination CTA
      const prevDate = new Date(data.dateObj.getFullYear(), data.dateObj.getMonth() - 1, 1)
      const previousMonthLabel = prevDate.toLocaleDateString("en-US", { month: "long" })

      return {
        monthYearLabel: label,
        previousMonthLabel,
        openCount: needsAttention.length,
        needsAttention,
        settled,
      }
    })

    const activeMonthGroup = groups[0] || emptyMonth


    // 5. Counterparty Net Rollups (open obligations only)
    const peopleMap = new Map<
      string,
      { name: string; netBalance: number; openItemsCount: number }
    >()

    for (const item of allParsedItems) {
      if (item.isSettled) continue
      const key = item.counterparty.toLowerCase()
      const existing = peopleMap.get(key) || {
        name: item.counterparty,
        netBalance: 0,
        openItemsCount: 0,
      }

      const delta =
        item.direction === "you_are_owed"
          ? item.remainingAmount
          : -item.remainingAmount

      existing.netBalance = roundCurrency(existing.netBalance + delta)
      existing.openItemsCount += 1
      peopleMap.set(key, existing)
    }

    const peopleRollup: PersonRollupItem[] = Array.from(peopleMap.values()).map((p) => ({
      name: p.name,
      initials: getCounterpartyInitials(p.name),
      netBalance: Math.abs(p.netBalance),
      direction: p.netBalance >= 0 ? "you_are_owed" : "you_owe",
      openItemsCount: p.openItemsCount,
    }))

    // 6. Summary KPI stats
    const openReceivables = allParsedItems.filter(
      (d) => d.direction === "you_are_owed" && !d.isSettled
    )
    const openPayables = allParsedItems.filter(
      (d) => d.direction === "you_owe" && !d.isSettled
    )

    const totalReceivables = roundCurrency(
      openReceivables.reduce((sum, d) => sum + d.remainingAmount, 0)
    )
    const totalPayables = roundCurrency(
      openPayables.reduce((sum, d) => sum + d.remainingAmount, 0)
    )
    const netDebtPosition = roundCurrency(totalReceivables - totalPayables)

    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    const clearedThisMonth = roundCurrency(
      rawChildren
        .filter((child) => new Date(child.created_at).getTime() >= startOfCurrentMonth)
        .reduce((sum, child) => sum + (Number(child.amount) || 0), 0)
    )

    return {
      groups,
      activeMonthGroup,
      peopleRollup,
      stats: {
        netDebtPosition,
        totalReceivables,
        totalPayables,
        clearedThisMonth,
        receivablesPeopleCount: peopleRollup.filter((p) => p.direction === "you_are_owed").length,
        payablesPeopleCount: peopleRollup.filter((p) => p.direction === "you_owe").length,
      },
    }
  }
)