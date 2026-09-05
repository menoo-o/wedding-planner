// app/dashboard/_db/debts.ts

import { cache } from "react"
import { createClient } from "@/utils/supabase/server"
import type { PaymentAccount, LoanStatus } from "@/lib/types"

// Re-export existing utilities and queries for downstream pages/analytics
// export {
//   computeDebtLoadRatio,
//   computeLifetimeDebt,
//   getActiveDebtLedger,
//   getSettledDebtHistory,
// } from "./ledger" // Adjust path if your file is named finance.ts or ledger.ts

// ── Types for the Unified In-Memory Debts Page ─────────────────

export interface DebtInstallment {
  id: string
  created_at: string
  amount: number
  payment_account: "cash" | "card"
  notes: string | null
  related_transaction_id: string
}

export interface UnifiedDebtRecord {
  id: string
  created_at: string
  counterparty_name: string
  description: string
  transaction_type: "loan_in" | "loan_out" | "expense"
  obligation_type: "loan" | "reimbursement"
  direction: "receivable" | "payable"
  payment_account: PaymentAccount | null
  original_amount: number
  total_paid: number
  remaining_amount: number
  progress_percentage: number
  status: LoanStatus
  installments: DebtInstallment[]
}

export interface PersonRollupItem {
  name: string
  initials: string
  netBalance: number
  direction: "receivable" | "payable"
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
  debts: UnifiedDebtRecord[]
  peopleRollup: PersonRollupItem[]
  stats: DebtsPageStats
}

// ── Internal Helpers ───────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (!parts.length || !parts[0]) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Main Debts Page Loader (In-Memory Prefetch Pattern) ────────

export const getDebtsPageData = cache(
  async (householdId: string): Promise<DebtsPageData> => {
    if (!householdId) {
      return {
        debts: [],
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

    // 1. Parallel Fetch: Parent obligations + All child installment payments
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
      console.error("Failed to fetch debts:", parentsRes.error.message)
      throw parentsRes.error
    }

    const rawParents = parentsRes.data || []
    const rawChildren = (childrenRes.data || []) as (DebtInstallment & {
      related_transaction_id: string
    })[]

    // 2. Index child installments: parentId -> DebtInstallment[]
    const installmentsMap = new Map<string, DebtInstallment[]>()
    for (const child of rawChildren) {
      if (!child.related_transaction_id) continue
      const existing = installmentsMap.get(child.related_transaction_id) ?? []
      existing.push({
        id: child.id,
        created_at: child.created_at,
        amount: Number(child.amount),
        payment_account: (child.payment_account as "cash" | "card") || "cash",
        notes: child.notes ?? null,
        related_transaction_id: child.related_transaction_id,
      })
      installmentsMap.set(child.related_transaction_id, existing)
    }

    // 3. Map unified records with dynamic balances
    const debts: UnifiedDebtRecord[] = rawParents.map((parent) => {
      const installments = installmentsMap.get(parent.id) ?? []
      const totalPaid = installments.reduce((sum, item) => sum + item.amount, 0)
      const originalAmount = Number(parent.amount)
      const remainingAmount = Math.max(0, originalAmount - totalPaid)

      const isReceivable = parent.transaction_type === "loan_out"
      const direction: "receivable" | "payable" = isReceivable ? "receivable" : "payable"

      let status: LoanStatus = "pending"
      if (
        remainingAmount <= 0 ||
        parent.loan_status === "settled" ||
        parent.reimbursement_status === "settled"
      ) {
        status = "settled"
      } else if (totalPaid > 0) {
        status = "partial"
      }

      const progressPercentage =
        originalAmount > 0
          ? Math.min(100, Math.round((totalPaid / originalAmount) * 100))
          : 0

      const counterparty = parent.counterparty_name?.trim() || "Unknown"
      const fallbackDesc =
        parent.transaction_type === "expense"
          ? "Trip / grocery reimbursement"
          : isReceivable
          ? `Lent to ${counterparty}`
          : `Borrowed from ${counterparty}`

      return {
        id: parent.id,
        created_at: parent.created_at,
        counterparty_name: counterparty,
        description: parent.description?.trim() || fallbackDesc,
        transaction_type: parent.transaction_type as "loan_in" | "loan_out" | "expense",
        obligation_type: parent.transaction_type === "expense" ? "reimbursement" : "loan",
        direction,
        payment_account: parent.payment_account as PaymentAccount | null,
        original_amount: originalAmount,
        total_paid: totalPaid,
        remaining_amount: remainingAmount,
        progress_percentage: progressPercentage,
        status,
        installments,
      }
    })

    // 4. Group counterparty net rollups
    const peopleMap = new Map<
      string,
      { name: string; netBalance: number; openItemsCount: number }
    >()

    for (const item of debts) {
      if (item.status === "settled") continue

      const key = item.counterparty_name.toLowerCase()
      const existing = peopleMap.get(key) || {
        name: item.counterparty_name,
        netBalance: 0,
        openItemsCount: 0,
      }

      const delta = item.direction === "receivable" ? item.remaining_amount : -item.remaining_amount
      existing.netBalance += delta
      existing.openItemsCount += 1
      peopleMap.set(key, existing)
    }

    const peopleRollup: PersonRollupItem[] = Array.from(peopleMap.values()).map((p) => ({
      name: p.name,
      initials: getInitials(p.name),
      netBalance: Math.abs(p.netBalance),
      direction: p.netBalance >= 0 ? "receivable" : "payable",
      openItemsCount: p.openItemsCount,
    }))

    // 5. Compute summary KPI metrics
    const activeReceivables = debts.filter(
      (d) => d.direction === "receivable" && d.status !== "settled"
    )
    const activePayables = debts.filter(
      (d) => d.direction === "payable" && d.status !== "settled"
    )

    const totalReceivables = activeReceivables.reduce((sum, d) => sum + d.remaining_amount, 0)
    const totalPayables = activePayables.reduce((sum, d) => sum + d.remaining_amount, 0)
    const netDebtPosition = totalReceivables - totalPayables

    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    const clearedThisMonth = rawChildren
      .filter((child) => new Date(child.created_at).getTime() >= startOfCurrentMonth)
      .reduce((sum, child) => sum + child.amount, 0)

    return {
      debts,
      peopleRollup,
      stats: {
        netDebtPosition,
        totalReceivables,
        totalPayables,
        clearedThisMonth,
        receivablesPeopleCount: peopleRollup.filter((p) => p.direction === "receivable").length,
        payablesPeopleCount: peopleRollup.filter((p) => p.direction === "payable").length,
      },
    }
  }
)