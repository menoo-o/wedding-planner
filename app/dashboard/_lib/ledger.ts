//app//dashboard/_lib/ledger.ts
import { cache } from "react"
import { createClient } from "@/utils/supabase/server"
import type {
  TransactionDbRow,
  ReceivableRecord,
  PayableRecord,
  PaginatedDebtHistory,
  PaymentAccount,
  LoanStatus,
} from "@/lib/types"

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

    // ── 1. Query settled base debts with explicit filter guards ──────────
    const { data: rawData, count, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        household_id,
        cycle_id,
        transaction_type,
        amount,
        counterparty_name,
        paid_by,
        payment_account,
        loan_status,
        reimbursement_status,
        related_transaction_id,
        created_at,
        description,
        notes
      `,
        { count: "exact" }
      )
      .eq("household_id", householdId)
      .in("transaction_type", ["loan_in", "loan_out", "expense"])
      .or("loan_status.eq.settled,reimbursement_status.eq.settled")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    const rows = (rawData || []) as TransactionDbRow[]

    // Enforce guard against regular household expenses (Point #3)
    const settledBaseRows = rows.filter((tx) => {
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

    // ── 2. Fetch actual repayments for this page slice (Point #4) ───────
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

    // ── 3. Shape into strict ReceivableRecord / PayableRecord (Point #1) ─
    const history: Array<ReceivableRecord | PayableRecord> = settledBaseRows.map((item) => {
      const settledAmount = repaymentMap.get(item.id) ?? Number(item.amount) // fallback to principal if settled without partial log
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