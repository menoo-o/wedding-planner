// app/dashboard/_lib/loanFormSchema.ts

import { z } from "zod"
import { UUID, MoneyAmount, DateString, DateTimeString, PaymentAccount } from "./topUpFormSchema"

// ── LoanForm schema (what the form itself collects) ────────────

export const LoanFormSchema = z.object({
  household_id: UUID,
  cycle_id: UUID,
  created_by: UUID,
  loan_type: z.enum(["loan_in", "loan_out"]),
  amount: MoneyAmount,
  payment_account: PaymentAccount,
  counterparty_name: z.string().min(1, "Name is required"),
  description: z.string(),
  transaction_date: DateString,
})

export type LoanFormData = z.infer<typeof LoanFormSchema>

// ── Insert payload validation (only what LoanForm can produce) ─
// Scoped to loan_in / loan_out (initial loan) and loan_return
// (installment repayments), not the full app-wide TransactionType.

export const LoanTransactionInsertSchema = z.object({
  household_id: UUID,
  cycle_id: UUID,
  created_by: UUID,
  transaction_type: z.enum(["loan_in", "loan_out", "loan_return"]),
  amount: MoneyAmount,
  description: z.string(),
  created_at: DateTimeString,
  payment_account: z.string(),
  category_id: z.string().nullable(),
  counterparty_name: z.string().nullable(),
  paid_by: z.string().nullable(),
  notes: z.string().nullable(),
  loan_status: z.enum(["pending", "partial", "settled"]).nullable().optional(),
  related_transaction_id: z.string().nullable().optional(),
})

export type LoanTransactionInsert = z.infer<typeof LoanTransactionInsertSchema>