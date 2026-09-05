//app/dashboard/_db/transactions.ts

import { cache } from "react"
import { createClient } from "@/utils/supabase/server"
import type { 
  CycleCalculationTransaction, 
  ReceivableRecord, 
  PayableRecord,
  CombinedDebtLedger,
  PaginatedDebtHistory,
  PaymentAccount,
  LoanStatus,
  TransactionDbRow
} from "@/lib/types"

// ── 1. getCycleTransactions (Current Month Dashboard Calculations) ──
export const getCycleTransactions = cache(
  async (householdId: string, cycleId: string): Promise<CycleCalculationTransaction[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id, household_id, cycle_id, amount, transaction_type, payment_account, 
        description, related_transaction_id, category_id, created_at, notes, 
        loan_status, reimbursement_status, paid_by, counterparty_name
      `)
      .eq("household_id", householdId)
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.error("Failed to fetch cycle transactions:", error?.message)
      return []
    }

    return data as CycleCalculationTransaction[]
  }
)

// ── 2. getPrevCycleExpenses (Runway / Burn Comparisons) ───────────
export const getPrevCycleExpenses = cache(
  async (householdId: string, cycleId: string): Promise<{ amount: number }[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("household_id", householdId)
      .eq("cycle_id", cycleId)
      .eq("transaction_type", "expense")

    if (error || !data) {
      console.error("Failed to fetch previous cycle expenses:", error?.message)
      return []
    }

    return data
  }
)

// ── 3. getTransactionsByType (Flexible Generic Pagination) ─────────
export async function getTransactionsByType(
  householdId: string,
  types: string[],
  options?: {
    cycleId?: string
    page?: number
    pageSize?: number
    orderBy?: string
    ascending?: boolean
  }
) {
  const supabase = await createClient()

  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("household_id", householdId)
    .in("transaction_type", types)

  if (options?.cycleId) query = query.eq("cycle_id", options.cycleId)

  const orderColumn = options?.orderBy || "created_at"
  query = query.order(orderColumn, {
    ascending: options?.ascending ?? false,
  })

  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) throw error

  const totalRecords = count ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize)

  return {
    data: data || [],
    totalRecords,
    totalPages,
    currentPage: page,
  }
}

// ── 4. getActiveDebtLedger (Option B: Fast, Open Loans Only) ────────
export const getActiveDebtLedger = cache(
  async (householdId: string): Promise<CombinedDebtLedger> => {
    const supabase = await createClient()

    // Query ONLY active/unsettled loans & payables
    const { data: rawDebts, error: debtsError } = await supabase
      .from("transactions")
      .select(`
        id, household_id, cycle_id, transaction_type, amount, counterparty_name,
        paid_by, payment_account, loan_status, reimbursement_status,
        related_transaction_id, created_at, description, notes
      `)
      .eq("household_id", householdId)
      .in("transaction_type", ["loan_in", "loan_out", "expense"])
      .or("loan_status.neq.settled,loan_status.is.null")
      .or("reimbursement_status.neq.settled,reimbursement_status.is.null")
      .order("created_at", { ascending: false })

    if (debtsError) throw debtsError

    const pendingDebts = ((rawDebts || []) as TransactionDbRow[]).filter((tx) => {
      if (tx.transaction_type === "expense") {
        return tx.paid_by === "someone_else"
      }
      return true
    })

    if (pendingDebts.length === 0) {
      return { receivables: [], payables: [], totalReceivable: 0, totalPayable: 0 }
    }

    // Secondary mini-lookup for repayments of THESE specific active debts only
    const parentIds = pendingDebts.map((d) => d.id)
    const { data: rawRepayments, error: repError } = await supabase
      .from("transactions")
      .select("amount, related_transaction_id")
      .in("related_transaction_id", parentIds)
      .in("transaction_type", ["loan_return", "settlement"])

    if (repError) throw repError

    const repaymentMap = new Map<string, number>()
    for (const rep of rawRepayments || []) {
      if (rep.related_transaction_id) {
        const sum = repaymentMap.get(rep.related_transaction_id) || 0
        repaymentMap.set(rep.related_transaction_id, sum + Number(rep.amount))
      }
    }

    const receivables: ReceivableRecord[] = []
    const payables: PayableRecord[] = []
    let totalReceivable = 0
    let totalPayable = 0

    for (const item of pendingDebts) {
      const settledAmount = repaymentMap.get(item.id) || 0
      const remainingAmount = Math.max(0, Number(item.amount) - settledAmount)

      if (remainingAmount <= 0) continue

      const status: LoanStatus = settledAmount > 0 ? "partial" : (item.loan_status || "pending")

      const record = {
        id: item.id,
        household_id: item.household_id,
        cycle_id: item.cycle_id,
        amount: Number(item.amount),
        settled_amount: settledAmount,
        remaining_amount: remainingAmount,
        payment_account: item.payment_account as PaymentAccount | null,
        counterparty_name: item.counterparty_name,
        description: item.description,
        created_at: item.created_at,
        notes: item.notes,
        related_transaction_id: item.related_transaction_id,
        is_settled: false,
      }

      if (item.transaction_type === "loan_out") {
        receivables.push({
          ...record,
          transaction_type: "loan_out",
          loan_status: status,
        })
        totalReceivable += remainingAmount
      } else {
        payables.push({
          ...record,
          transaction_type: item.transaction_type as "loan_in" | "expense",
          paid_by: item.paid_by,
          loan_status: item.transaction_type === "loan_in" ? status : null,
          reimbursement_status: item.transaction_type === "expense" ? status : null,
        })
        totalPayable += remainingAmount
      }
    }

    return { receivables, payables, totalReceivable, totalPayable }
  }
)

// ── 5. getSettledDebtHistory (Paginated Archive Query) ───────────────
export const getSettledDebtHistory = cache(
  async (
    householdId: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<PaginatedDebtHistory> => {
    const supabase = await createClient()
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 10
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: rawData, count, error } = await supabase
      .from("transactions")
      .select(`
        id, household_id, cycle_id, transaction_type, amount, counterparty_name,
        paid_by, payment_account, loan_status, reimbursement_status,
        related_transaction_id, created_at, description, notes
      `, { count: "exact" })
      .eq("household_id", householdId)
      .in("transaction_type", ["loan_in", "loan_out", "expense"])
      .or("loan_status.eq.settled,reimbursement_status.eq.settled")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    const settledBaseRows = ((rawData || []) as TransactionDbRow[]).filter((tx) => {
      if (tx.transaction_type === "expense") {
        return tx.paid_by === "someone_else"
      }
      return true
    })

    if (settledBaseRows.length === 0) {
      return {
        history: [],
        totalRecords: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
        currentPage: page,
      }
    }

    const parentIds = settledBaseRows.map((r) => r.id)
    const { data: rawRepayments, error: repError } = await supabase
      .from("transactions")
      .select("amount, related_transaction_id")
      .in("related_transaction_id", parentIds)
      .in("transaction_type", ["loan_return", "settlement"])

    if (repError) throw repError

    const repaymentMap = new Map<string, number>()
    for (const rep of rawRepayments || []) {
      if (rep.related_transaction_id) {
        const currentSum = repaymentMap.get(rep.related_transaction_id) || 0
        repaymentMap.set(rep.related_transaction_id, currentSum + Number(rep.amount))
      }
    }

    const history: Array<ReceivableRecord | PayableRecord> = settledBaseRows.map((item) => {
      const settledAmount = repaymentMap.get(item.id) ?? Number(item.amount)
      const remainingAmount = Math.max(0, Number(item.amount) - settledAmount)

      const baseRecord = {
        id: item.id,
        household_id: item.household_id,
        cycle_id: item.cycle_id,
        amount: Number(item.amount),
        settled_amount: settledAmount,
        remaining_amount: remainingAmount,
        payment_account: item.payment_account as PaymentAccount | null,
        counterparty_name: item.counterparty_name,
        description: item.description,
        created_at: item.created_at,
        notes: item.notes,
        related_transaction_id: item.related_transaction_id,
        is_settled: true,
      }

      if (item.transaction_type === "loan_out") {
        return {
          ...baseRecord,
          transaction_type: "loan_out",
          loan_status: "settled" as LoanStatus,
        } as ReceivableRecord
      }

      return {
        ...baseRecord,
        transaction_type: item.transaction_type as "loan_in" | "expense",
        paid_by: item.paid_by,
        loan_status: item.transaction_type === "loan_in" ? ("settled" as LoanStatus) : null,
        reimbursement_status: item.transaction_type === "expense" ? ("settled" as LoanStatus) : null,
      } as PayableRecord
    })

    const totalRecords = count ?? 0
    return {
      history,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page,
    }
  }
)