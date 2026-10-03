// app/dashboard/_lib/emergency-spendSchema.ts
import { z } from "zod"

export const VAULT_EXPENSE_CATEGORIES = [
  "medical",
  "education",
  "legal",
  "home_repair",
  "other",
] as const

export const VAULT_EXPENSE_STATUSES = ["paid", "planned"] as const
export const VAULT_EXPENSE_RECURRENCES = [
  "one_time",
  "semester",
  "annual",
  "custom",
] as const

export const baseEmergencyExpenseSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title is too long"),
  payee_name: z
    .string()
    .max(100, "Payee name is too long")
    .optional()
    .or(z.literal("")),
  category: z.enum(VAULT_EXPENSE_CATEGORIES, {
    message: "Please select a valid category",
  }),
  amount: z
    .number({ message: "Enter a valid amount" })
    .positive("Amount must be greater than 0"),
  status: z.enum(VAULT_EXPENSE_STATUSES),
  recurrence: z.enum(VAULT_EXPENSE_RECURRENCES),
  incurred_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z
    .string()
    .max(255, "Notes cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
})

export const createEmergencyExpenseSchema = (maxBalance: number) =>
  baseEmergencyExpenseSchema.refine(
    (data) => {
      if (data.status === "paid") {
        return data.amount <= maxBalance
      }
      return true
    },
    {
      message: `Amount exceeds available emergency vault (Rs ${maxBalance.toLocaleString()})`,
      path: ["amount"],
    }
  )

export type EmergencyExpenseFormData = z.infer<typeof baseEmergencyExpenseSchema>