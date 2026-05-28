// // components/ExpenseForm/TransactionForm.tsx
// "use client"
// "use no memo" // Silences the React Compiler watch warning safely

// import { useForm } from "react-hook-form"
// import { useDashboard } from "@/app/dashboard/DashboardProvider"
// // import { insertExpense } from "@/app/dashboard/queries"

// // ─────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────

// type ExpenseFormData = {
//   amount: number
//   category_id: string | null
//   description: string
//   notes: string | null
//   transaction_date: string
//   paid_by: "household" | "other"
//   payment_account: "cash" | "card" | "personal"
//   counterparty_name: string | null
// }

// function getTodayString() {
//   return new Date().toISOString().split("T")[0]
// }

// // ─────────────────────────────────────────────
// // Props
// // ─────────────────────────────────────────────

// interface TransactionFormProps {
//   /** Called after a successful insert so the parent modal can close */
//   onSuccess?: () => void
// }

// // ─────────────────────────────────────────────
// // Component
// // ─────────────────────────────────────────────

// export default function TransactionForm({ onSuccess }: TransactionFormProps) {
//   // All DB context comes from the provider — zero prop drilling needed
//   const { householdId, currentCycleId, createdBy, categories } = useDashboard()

//   const {
//     register,
//     handleSubmit,
//     watch,
//     reset,
//     setError,
//     formState: { errors, isSubmitting },
//   } = useForm<ExpenseFormData>({
//     defaultValues: {
//       amount: undefined,
//       category_id: null,
//       description: "",
//       notes: null,
//       transaction_date: getTodayString(),
//       paid_by: "household",
//       payment_account: "cash",
//       counterparty_name: null,
//     },
//   })

//   const watchedPaidBy = watch("paid_by")

//   async function onSubmit(data: ExpenseFormData) {
//     const result = await insertExpense({
//       household_id: householdId,
//       cycle_id: currentCycleId,
//       created_by: createdBy,
//       amount: data.amount,
//       category_id: data.category_id || null,
//       description: data.description,
//       notes: data.notes,
//       transaction_date: data.transaction_date,
//       paid_by: data.paid_by,
//       payment_account: data.payment_account,
//       counterparty_name: data.counterparty_name,
//     })

//     if (!result.success) {
//       // Surface the DB error on the description field as a fallback
//       setError("description", {
//         type: "server",
//         message: result.error ?? "Something went wrong. Please try again.",
//       })
//       return
//     }

//     // Reset form to clean defaults for the next entry
//     reset({
//       amount: undefined,
//       category_id: null,
//       description: "",
//       notes: null,
//       transaction_date: getTodayString(),
//       paid_by: "household",
//       payment_account: "cash",
//       counterparty_name: null,
//     })

//     onSuccess?.()
//   }

//   return (
//     <form
//       onSubmit={handleSubmit(onSubmit)}
//       className="space-y-4 p-5"
//     >
//       <div>
//         <h2 className="text-lg font-bold text-gray-900">Record Expense</h2>
//         <p className="text-xs text-gray-500">
//           Adds an immediate debit to the active cycle log.
//         </p>
//       </div>

//       {/* ── Date ── */}
//       <div>
//         <label className="block text-xs font-semibold text-gray-600 mb-1">
//           Transaction Date *
//         </label>
//         <input
//           type="date"
//           {...register("transaction_date", { required: "Date is required" })}
//           suppressHydrationWarning
//           className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
//         />
//         {errors.transaction_date && (
//           <p className="text-red-500 text-xs mt-1">{errors.transaction_date.message}</p>
//         )}
//       </div>

//       {/* ── Amount ── */}
//       <div>
//         <label className="block text-xs font-semibold text-gray-600 mb-1">
//           Amount *
//         </label>
//         <input
//           type="number"
//           step="0.01"
//           placeholder="0.00"
//           {...register("amount", {
//             required: "Amount is required",
//             valueAsNumber: true,
//             validate: (val) => val > 0 || "Amount must be greater than 0",
//           })}
//           className="w-full border border-gray-300 p-2 rounded-lg text-base font-medium outline-none focus:ring-2 focus:ring-red-500"
//         />
//         {errors.amount && (
//           <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
//         )}
//       </div>

//       {/* ── Category ── */}
//       <div>
//         <label className="block text-xs font-semibold text-gray-600 mb-1">
//           Category *
//         </label>
//         <select
//           {...register("category_id", { required: "Category is required" })}
//           className="w-full border border-gray-300 p-2 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
//         >
//           <option value="">Select a category</option>
//           {categories.map((c) => (
//             <option key={c.id} value={c.id}>
//               {c.name}
//             </option>
//           ))}
//         </select>
//         {errors.category_id && (
//           <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>
//         )}
//       </div>

//       {/* ── Description ── */}
//       <div>
//         <label className="block text-xs font-semibold text-gray-600 mb-1">
//           Description *
//         </label>
//         <input
//           type="text"
//           placeholder="e.g., Office groceries, internet bill"
//           {...register("description", { required: "Description is required" })}
//           className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
//         />
//         {errors.description && (
//           <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
//         )}
//       </div>

//       {/* ── Who Paid? ── */}
//       <div>
//         <label className="block text-xs font-semibold text-gray-600 mb-1">
//           Who Paid?
//         </label>
//         <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
//           <label
//             className={`flex-1 text-center py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all ${
//               watchedPaidBy === "household"
//                 ? "bg-white text-red-600 shadow-sm"
//                 : "text-gray-500"
//             }`}
//           >
//             <input
//               type="radio"
//               value="household"
//               {...register("paid_by")}
//               className="sr-only"
//             />
//             House Fund
//           </label>
//           <label
//             className={`flex-1 text-center py-1.5 rounded-md cursor-pointer text-xs font-medium transition-all ${
//               watchedPaidBy === "other"
//                 ? "bg-white text-red-600 shadow-sm"
//                 : "text-gray-500"
//             }`}
//           >
//             <input
//               type="radio"
//               value="other"
//               {...register("paid_by")}
//               className="sr-only"
//             />
//             Someone Else
//           </label>
//         </div>
//       </div>

//       {/* ── Conditional: payment source OR payer name ── */}
//       {watchedPaidBy === "household" ? (
//         <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
//           <label className="block text-xs font-semibold text-gray-500 mb-1.5">
//             Payment Source
//           </label>
//           <div className="flex gap-4">
//             <label className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
//               <input
//                 type="radio"
//                 value="cash"
//                 {...register("payment_account")}
//                 className="mr-1.5 accent-red-600"
//               />
//               Cash Wallet
//             </label>
//             <label className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
//               <input
//                 type="radio"
//                 value="card"
//                 {...register("payment_account")}
//                 className="mr-1.5 accent-red-600"
//               />
//               Bank Card
//             </label>
//           </div>
//         </div>
//       ) : (
//         <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
//           <label className="block text-xs font-semibold text-gray-600 mb-1">
//             Payers Name *
//           </label>
//           <input
//             type="text"
//             placeholder="Who paid for this?"
//             {...register("counterparty_name", {
//               validate: (val) =>
//                 watchedPaidBy !== "other" ||
//                 (val != null && val.trim() !== "") ||
//                 "Please specify who paid for this expense",
//             })}
//             className="w-full border border-gray-300 p-2 rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-red-500"
//           />
//           {errors.counterparty_name && (
//             <p className="text-red-500 text-xs mt-1">
//               {errors.counterparty_name.message}
//             </p>
//           )}
//         </div>
//       )}

//       {/* ── Notes ── */}
//       <div>
//         <label className="block text-xs font-semibold text-gray-600 mb-1">
//           Notes (Optional)
//         </label>
//         <textarea
//           {...register("notes")}
//           className="w-full border border-gray-300 p-2 rounded-lg h-16 text-sm resize-none outline-none focus:ring-2 focus:ring-red-500"
//           placeholder="Add context, store info..."
//         />
//       </div>

//       {/* ── Submit ── */}
//       <button
//         type="submit"
//         disabled={isSubmitting}
//         className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm mt-2"
//       >
//         {isSubmitting ? "Saving Entry..." : "Record Expense"}
//       </button>
//     </form>
//   )
// }