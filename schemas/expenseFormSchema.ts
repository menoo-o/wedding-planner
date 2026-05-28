// import { z } from "zod";

// export const expenseFormSchema = z.zodObject({
//   // Behind-the-scenes System Context
//   household_id: z.string().uuid("Invalid household identifier"),
//   cycle_id: z.string().uuid("Invalid cycle identifier"),

//   // Core Form Inputs
//   amount: z.number({ required_error: "Amount is required" })
//     .positive("Amount must be greater than 0"),
//   category_id: z.string().uuid("Please select a valid category").nullable(),
//   description: z.string().min(1, "Description is required").trim(),
//   notes: z.string().trim().nullable().optional(),
//   transaction_date: z.string().min(1, "Date is required"),

//   // Conditional Logic States
//   paid_by: z.enum(["household", "other"]),
//   payment_account: z.enum(["cash", "card", "personal"]),
//   counterparty_name: z.string().trim().nullable().optional(),
// }).superRefine((data, ctx) => {
//   // Scenario 2 Guard: Someone else paid -> Counterparty Name is MANDATORY
//   if (data.paid_by === "other") {
//     if (!data.counterparty_name || data.counterparty_name.trim() === "") {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ["counterparty_name"],
//         message: "Please specify who paid for this expense",
//       });
//     }
//   }
// });

// // Auto-generate TypeScript Type directly from your validation rules
// export type ExpenseFormData = z.infer<typeof expenseFormSchema>;