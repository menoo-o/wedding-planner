import { z } from "zod"

// ─────────────────────────────────────────────────────────────────────────────
// 1. DESCRIPTION VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────
// No changes needed here — .refine() still works the same in v4.
// But note: the `message` param in .refine() is deprecated, use `error` instead.
const descriptionValidator = z
  .string()
  .min(3, { error: "Description must be at least 3 characters" })   // v4: use `error` not `message`
  .max(120, { error: "Description cannot exceed 120 characters" })
  .regex(/^[a-zA-Z0-9\s\.,!?'"-]+$/, { error: "Description contains invalid characters" })
  .refine(
    (val) => {
      const trimmed = val.trim()

      if (trimmed.length === 0) return false
      if (/^[\d\s]+$/.test(trimmed)) return false
      if (/^[^a-zA-Z0-9]+$/.test(trimmed)) return false

      const repeatedChars = /(.)\1{2,}/g
      if (repeatedChars.test(trimmed)) {
        const words = trimmed.split(/\s+/)
        for (const word of words) {
          const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '')
          if (cleanWord.length >= 3 && /^(.)\1{2,}$/.test(cleanWord)) {
            return false
          }
        }
      }
      return true
    },
    {
      error: "Please enter a meaningful description (e.g., 'Dinner at Cafe' or 'Groceries')", // v4: `error` not `message`
    }
  )

// ─────────────────────────────────────────────────────────────────────────────
// 2. COUNTERPARTY VALIDATOR (was unused — now used in superRefine below)
// ─────────────────────────────────────────────────────────────────────────────
// v4: .refine() second arg uses `error` instead of plain string message
const counterpartyValidator = z
  .string()
  .min(2, { error: "Name must be at least 2 characters" })
  .max(50, { error: "Name cannot exceed 50 characters" })
  .refine(
    (val) => val.trim().length > 0,
    { error: "Name cannot be just spaces" }  // v4: must be { error: "..." } not just "..."
  )
  .refine(
    (val) => {
      const trimmed = val.trim()
      if (/^[\d\s]+$/.test(trimmed)) return false
      if (/^[^a-zA-Z\s]+$/.test(trimmed)) return false
      return true
    },
    { error: "Please enter a valid name" }   // v4: must be { error: "..." }
  )

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORY VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────
const categoryValidator = z
  .string()
  .min(2, { error: "Category name must be at least 2 characters" })
  .max(30, { error: "Category name cannot exceed 30 characters" })
  .refine(
    (val) => val.trim().length > 0,
    { error: "Category name cannot be just spaces" }
  )
  .refine(
    (val) => {
      const trimmed = val.trim()
      if (/^[\d\s]+$/.test(trimmed)) return false
      if (/^[^a-zA-Z]+$/.test(trimmed)) return false
      return true
    },
    { error: "Please enter a valid category name" }
  )

// ─────────────────────────────────────────────────────────────────────────────
// 4. NOTES VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────
const notesValidator = z
  .string()
  .max(500, { error: "Notes cannot exceed 500 characters" })
  .refine(
    (val) => {
      if (val.length === 0) return true
      const trimmed = val.trim()
      if (trimmed.length === 0) return true
      if (/^[\d\s]+$/.test(trimmed)) return false
      if (/^[^a-zA-Z0-9\s\.,!?'"\-]+$/.test(trimmed)) return false
      return true
    },
    { error: "Notes contain invalid characters or are purely numeric" }
  )
  .optional()

// ─────────────────────────────────────────────────────────────────────────────
// 5. EXPENSE SCHEMA (MAIN) — ZOD V4 FIXES APPLIED
// ─────────────────────────────────────────────────────────────────────────────
export const expenseSchema = z
  .object({
    amount: z
      .number({
        // v4 BREAKING: `required_error` and `invalid_type_error` are DROPPED.
        // Use unified `error` function instead.
        error: (issue) =>
          issue.input === undefined
            ? "Amount is required"
            : "Amount must be a number",
      })
      .positive({ error: "Amount must be greater than zero" })
      .max(999999999, { error: "Amount is too large" })
      .refine((val) => {
        return Number(val.toFixed(2)) === val
      }, { error: "Amount can only have up to 2 decimal places" }),

    description: descriptionValidator,

    category_id: z
      .string({
        // v4 BREAKING: `required_error` dropped → use `error` function
        error: (issue) =>
          issue.input === undefined
            ? "Please select a category"
            : "Invalid category",
      })
      .min(1, { error: "Please select a category" }),

    paid_by: z.enum(["household", "someone_else"], {
      // v4 BREAKING: `required_error` / `invalid_type_error` dropped on enum too.
      // Use unified `error` function:
      error: (issue) =>
        issue.input === undefined
          ? "Please select who paid"
          : "Invalid payment option",
    }),

    // v4: `z.union([z.enum(["cash", "card"]), z.null()]).nullable().optional()`
    // still works, but `.nullable()` is preferred over union-with-null for clarity.
    // However, since this is conditional (only required when paid_by === "household"),
    // we keep it as optional and validate in superRefine.
    payment_account: z
      .enum(["cash", "card"])
      .optional()
      .nullable(),

    counterparty_name: z.string().optional(),

    notes: notesValidator,
  })
  // v4: .superRefine() is NO LONGER DEPRECATED (as of Aug 2025).
  // It was briefly deprecated in favor of .check(), but that was reverted.
  // However, ctx.path is DROPPED in v4 — don't use it.
  // Also, ctx.addIssue() code should use z.core.$ZodIssueCustom or just "custom".
  .superRefine((data, ctx) => {
    // 1. Payment account validation
    if (data.paid_by === "household") {
      if (!data.payment_account) {
        ctx.addIssue({
          code: "custom", // v4: still works, or use z.core.$ZodIssueCustom
          path: ["payment_account"],
          message: "Please select a payment source (Cash or Card)",
        })
      }
    }

    // 2. Counterparty validation
    if (data.paid_by === "someone_else") {
      if (!data.counterparty_name || data.counterparty_name.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["counterparty_name"],
          message: "Please enter who paid",
        })
      } else {
        const trimmed = data.counterparty_name.trim()

        if (trimmed.length < 2) {
          ctx.addIssue({
            code: "custom",
            path: ["counterparty_name"],
            message: "Name must be at least 2 characters",
          })
        }
        if (trimmed.length > 50) {
          ctx.addIssue({
            code: "custom",
            path: ["counterparty_name"],
            message: "Name cannot exceed 50 characters",
          })
        }
        if (/^[\d\s]+$/.test(trimmed)) {
          ctx.addIssue({
            code: "custom",
            path: ["counterparty_name"],
            message: "Name cannot be just numbers",
          })
        }
        if (/^[^a-zA-Z\s]+$/.test(trimmed)) {
          ctx.addIssue({
            code: "custom",
            path: ["counterparty_name"],
            message: "Please enter a valid name",
          })
        }
      }
    }
  })

// ─────────────────────────────────────────────────────────────────────────────
// 6. ALTERNATIVE SCHEMA USING .refine() CHAINING
// ─────────────────────────────────────────────────────────────────────────────
// v4: .refine() still works. The `message` param is deprecated — use `error`.
// Also, `path` inside .refine() options still works.
export const expenseSchemaAlt = z
  .object({
    amount: z.number().positive({ error: "Amount must be positive" }),
    description: descriptionValidator,
    category_id: z.string().min(1, { error: "Please select a category" }),
    paid_by: z.enum(["household", "someone_else"], {
      error: (issue) =>
        issue.input === undefined
          ? "Please select who paid"
          : "Invalid payment option",
    }),
    payment_account: z.enum(["cash", "card"]).optional().nullable(),
    counterparty_name: z.string().optional(),
    notes: notesValidator,
  })
  .refine(
    (data) => {
      if (data.paid_by === "household") {
        return !!data.payment_account
      }
      return true
    },
    {
      error: "Please select a payment source", // v4: `error` not `message`
      path: ["payment_account"],
    }
  )
  .refine(
    (data) => {
      if (data.paid_by === "someone_else") {
        return !!(data.counterparty_name && data.counterparty_name.trim().length > 0)
      }
      return true
    },
    {
      error: "Please enter who paid",
      path: ["counterparty_name"],
    }
  )
  .refine(
    (data) => {
      if (data.paid_by === "someone_else" && data.counterparty_name) {
        const trimmed = data.counterparty_name.trim()
        return !/^[\d\s]+$/.test(trimmed) && !/^[^a-zA-Z\s]+$/.test(trimmed)
      }
      return true
    },
    {
      error: "Please enter a valid name",
      path: ["counterparty_name"],
    }
  )
  .refine(
    (data) => {
      if (data.paid_by === "someone_else" && data.counterparty_name) {
        const trimmed = data.counterparty_name.trim()
        return trimmed.length >= 2 && trimmed.length <= 50
      }
      return true
    },
    {
      error: "Name must be between 2 and 50 characters",
      path: ["counterparty_name"],
    }
  )

// ─────────────────────────────────────────────────────────────────────────────
// 7. TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export type ExpenseFormData = z.infer<typeof expenseSchema>

export const categorySchema = z.object({
  name: categoryValidator,
})

export type CategoryFormData = z.infer<typeof categorySchema>