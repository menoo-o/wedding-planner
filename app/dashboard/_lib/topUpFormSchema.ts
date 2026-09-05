// lib/schemas.ts
// Zod schemas for TopUpForm & Supabase insert validation

import { z } from "zod"

// ── Shared Primitives ─────────────────────────────────────────

// Zod v4 moved string-format validators (uuid, date, datetime, email, etc.)
// out of the .string() chain and into top-level / z.iso helpers.
// The old z.string().uuid() / .date() / .datetime() chained forms still work
// but are deprecated in v4 and will warn — use the forms below instead.

export const UUID = z.uuid()

export const MoneyAmount = z.number().positive("Amount must be greater than 0")

export const DateString = z.iso.date()

export const DateTimeString = z.iso.datetime({ offset: true })

export const PaymentAccount = z.enum(["cash", "card"])

export const TransactionType = z.enum([
  "expense",
  "top_up",
  "loan_in",
  "loan_out",
  "loan_return",
  "settlement",
  "transfer",
  "adjustment",
  "refund",
])

export const LoanStatus = z.enum(["pending", "partial", "settled"])

export const ReimbursementStatus = z.enum(["pending", "partial", "settled"])

// ── TopUpForm Schema ──────────────────────────────────────────

export const TopUpFormSchema = z.object({
  household_id: UUID,
  cycle_id: UUID,
  created_by: UUID,
  amount: MoneyAmount,
  description: z.string().trim().min(1, "Description is required"),
  transaction_date: DateString,
  payment_account: PaymentAccount,
})

export type TopUpFormData = z.infer<typeof TopUpFormSchema>

// ── Supabase DB Insert Payload ────────────────────────────────

export const TransactionInsertSchema = z.object({
  household_id: UUID,
  cycle_id: UUID,
  created_by: UUID,
  transaction_type: TransactionType,
  amount: MoneyAmount,
  description: z.string().trim().nullable().default(""),
  created_at: DateTimeString,
  payment_account: z.string().nullable().default(null),
  category_id: z.uuid().nullable().default(null),
  counterparty_name: z.string().trim().nullable().default(null),
  paid_by: z.enum(["household", "someone_else"]).nullable().default("household"),
  notes: z.string().trim().nullable().default(null),
  loan_status: LoanStatus.nullable().default(null),
  reimbursement_status: ReimbursementStatus.nullable().default(null),
  related_transaction_id: z.uuid().nullable().default(null),
})

export type TransactionInsert = z.infer<typeof TransactionInsertSchema>