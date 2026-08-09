// app/dashboard/components/modals/AddExpenseModal.tsx
"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import {
  X,
  Plus,
  Wallet,
  CreditCard,
  Tag,
  // FileText,
  Loader2,
  Check,
  ChevronDown,
  User,
} from "lucide-react"
import Toast, { useToast } from "../Toast"

// ── Types ─────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
}

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  householdId: string
  currentCycleId: string
  createdBy: string
  cashBalance: number
  cardBalance: number
  onCategoryCreated: (category: Category) => void
}

interface ExpenseFormData {
  amount: number
  description: string
  category_id: string
  paid_by: "household" | "someone_else"
  payment_account: "cash" | "card" | null  // ← allow null
  counterparty_name: string
  notes: string
}

/* ═══════════════════════════════════════════════════════════════
   VENDOR CODE — COMMENTED OUT FOR FUTURE USE
   ═══════════════════════════════════════════════════════════════ */
// ... keep existing vendor comments

// ── Component ─────────────────────────────────────────────────

export default function AddExpenseModal({
  isOpen,
  onClose,
  categories,
  householdId,
  currentCycleId,
  createdBy,
  cashBalance,
  cardBalance,
  onCategoryCreated,
}: AddExpenseModalProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast, show, dismiss } = useToast()

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isNotesOpen, setIsNotesOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      amount: undefined as unknown as number,
      description: "",
      category_id: categories[0]?.id || "",
      paid_by: "household",
      payment_account: "cash",
      counterparty_name: "",
      notes: "",
    },
  })

  const watchedPaidBy = watch("paid_by")
  const watchedPaymentAccount = watch("payment_account")

  // Auto-set payment_account when paid_by changes
useEffect(() => {
  if (watchedPaidBy === "someone_else") {
    setValue("payment_account", null)  // ← already done
    setValue("counterparty_name", "")
  } else {
    setValue("payment_account", "cash")
    setValue("counterparty_name", "")
  }
}, [watchedPaidBy, setValue])

  // ── Submit Expense ─────────────────────────────────────────
  async function onSubmit(data: ExpenseFormData) {
    if (!householdId || !currentCycleId || !createdBy) {
      show("error", "Configuration Error", "Missing active ledger. Please refresh.")
      return
    }

    // Validate counterparty required for someone_else
    if (data.paid_by === "someone_else" && !data.counterparty_name.trim()) {
      show("error", "Missing Info", "Please enter who paid for this expense.")
      return
    }

    startTransition(async () => {
      try {
        const isSomeoneElse = data.paid_by === "someone_else"

        const payload = {
          household_id: householdId,
          cycle_id: currentCycleId,
          created_by: createdBy,
          transaction_type: "expense",
          amount: Number(data.amount),
          description: data.description.trim(),
          category_id: data.category_id || null,
          notes: data.notes.trim() || null,
          paid_by: data.paid_by,
          payment_account: isSomeoneElse ? null : data.payment_account,
          counterparty_name: isSomeoneElse ? data.counterparty_name.trim() : null,
          // 🆕 reimbursement_status only for someone_else expenses
          reimbursement_status: isSomeoneElse ? "pending" : null,
          loan_status: null,
          vendor_id: null,
          parent_settlement_id: null,
        }

        const { error } = await supabase.from("transactions").insert([payload])

        if (error) throw new Error(error.message)

        reset()
        show(
          "success",
          "Expense Recorded",
          isSomeoneElse
            ? `${data.description} — Rs ${data.amount.toLocaleString()} (owed to ${data.counterparty_name})`
            : `${data.description} — Rs ${data.amount.toLocaleString()}`
        )

        setTimeout(() => {
          onClose()
          router.refresh()
        }, 1200)
      } catch (err: unknown) {
        show("error", "Failed to Record", err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  // ── Create Category Inline ─────────────────────────────────
  async function handleCreateCategory() {
    if (!newCategoryName.trim() || !householdId) return

    startTransition(async () => {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          household_id: householdId,
          name: newCategoryName.trim(),
        })
        .select("id, name")
        .single()

      if (error) {
        show("error", "Category Failed", error.message)
        return
      }

      if (data) {
        onCategoryCreated(data)
        setValue("category_id", data.id)
        setNewCategoryName("")
        setIsAddingCategory(false)
        show("success", "Category Created", `"${data.name}" is now available`)
      }
    })
  }

const accountOptions = [
  {
    value: "cash" as const,
    label: "Cash",
    balance: cashBalance,
    icon: <Wallet size={16} strokeWidth={1.5} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",        // ← ADD THIS
  },
  {
    value: "card" as const,
    label: "Card",
    balance: cardBalance,
    icon: <CreditCard size={16} strokeWidth={1.5} />,
    color: "text-blue-600",
    bg: "bg-blue-50",           // ← ADD THIS
  },
]

  if (!isOpen) return null

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2d3436]/30 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

{/* Modal */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
  <div
    className="bg-white rounded-[2rem] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.15)] w-full max-w-4xl pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 overflow-hidden max-h-[92vh]"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Split layout: Header + Form side by side or top + 2-col */}
    <div className="flex flex-col h-full max-h-[92vh]">
      
      {/* Header — full width */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
        <div>
          <h2 className="text-xl font-bold text-[#2d3436]">Add Expense</h2>
          <p className="text-sm text-gray-400 mt-1">
            {watchedPaidBy === "someone_else"
              ? "Record an expense paid by someone else"
              : "Record a new household expense"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Form — 2 column layout */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              
              {/* Amount — bigger */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                    Rs
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("amount", {
                      required: "Required",
                      valueAsNumber: true,
                      validate: (v) => v > 0 || "Must be greater than zero",
                    })}
                    className={`w-full pl-14 pr-4 py-4 bg-gray-50 border-2 rounded-2xl text-xl font-bold text-[#2d3436] outline-none transition-all focus:bg-white focus:border-[#8b9dc3] focus:ring-4 focus:ring-[#8b9dc3]/10 ${
                      errors.amount ? "border-red-300 bg-red-50" : "border-transparent"
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-xs font-medium">{errors.amount.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                  Description *
                </label>
                <input
                  type="text"
                  placeholder="What did you spend on?"
                  {...register("description", { required: "Required" })}
                  className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-sm font-medium text-[#2d3436] outline-none transition-all focus:bg-white focus:border-[#8b9dc3] focus:ring-4 focus:ring-[#8b9dc3]/10 ${
                    errors.description ? "border-red-300 bg-red-50" : "border-transparent"
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs font-medium">{errors.description.message}</p>
                )}
              </div>

              {/* Paid By — bigger cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                  Paid By *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "household" as const, label: "House Fund", icon: <Wallet size={18} /> },
                    { value: "someone_else" as const, label: "Someone Else", icon: <User size={18} /> },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        watchedPaidBy === option.value
                          ? option.value === "someone_else"
                            ? "border-[#e17055] bg-[#e17055]/5 text-[#e17055]"
                            : "border-[#2d3436] bg-[#2d3436] text-white"
                          : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...register("paid_by")}
                        className="sr-only"
                      />
                      <span>{option.icon}</span>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Counterparty — only for someone_else */}
              {watchedPaidBy === "someone_else" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[11px] font-bold tracking-[0.15em] text-[#e17055] uppercase">
                    Who Paid? *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e17055]" />
                    <input
                      type="text"
                      placeholder="e.g., Ali, Friend"
                      {...register("counterparty_name", {
                        required: watchedPaidBy === "someone_else" ? "Required" : false,
                      })}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#e17055]/5 border-2 border-[#e17055]/20 rounded-2xl text-sm font-medium text-[#2d3436] outline-none focus:ring-4 focus:ring-[#e17055]/10"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    You wll owe them Rs {watch("amount") || 0}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              
              {/* Payment Source — only for household */}
              {watchedPaidBy === "household" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                    Payment Source *
                  </label>
                  <div className="space-y-2">
                    {accountOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          watchedPaymentAccount === option.value
                            ? "border-[#8b9dc3] bg-[#8b9dc3]/5"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...register("payment_account")}
                          className="sr-only"
                        />
                        <span className={`w-10 h-10 rounded-xl ${option.bg} flex items-center justify-center ${option.color}`}>
                          {option.icon}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-[#2d3436] block">{option.label}</span>
                          <span className="text-xs text-gray-400">Rs {option.balance.toLocaleString()}</span>
                        </div>
                        {watchedPaymentAccount === option.value && (
                          <span className="w-6 h-6 bg-[#8b9dc3] rounded-full flex items-center justify-center">
                            <Check size={14} strokeWidth={3} className="text-white" />
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                    Category *
                  </label>
                  {!isAddingCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#8b9dc3] hover:text-[#6b7a9c] transition-colors"
                    >
                      <Plus size={14} strokeWidth={2} />
                      New
                    </button>
                  )}
                </div>

                {isAddingCategory ? (
                  <div className="flex gap-2 animate-in slide-in-from-top-2">
                    <input
                      type="text"
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleCreateCategory()
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-[#8b9dc3]/5 border-2 border-[#8b9dc3]/20 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-[#8b9dc3]/10"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim() || isPending}
                      className="px-5 py-3 bg-[#8b9dc3] hover:bg-[#7a8bb2] disabled:bg-gray-200 text-white rounded-2xl text-sm font-semibold transition-colors"
                    >
                      {isPending ? <Loader2 size={16} className="animate-spin" /> : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false)
                        setNewCategoryName("")
                      }}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl transition-colors"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      {...register("category_id", { required: "Required" })}
                      className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-medium text-[#2d3436] outline-none focus:bg-white focus:border-[#8b9dc3] focus:ring-4 focus:ring-[#8b9dc3]/10 appearance-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Notes */}
             {/* Notes — Collapsed by Default */}
              <div className="space-y-2">
                {!isNotesOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsNotesOpen(true)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-[#8b9dc3] transition-colors"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                    Add Notes
                  </button>
                ) : (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                        Notes
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotesOpen(false)
                          setValue("notes", "") // clear on close
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <textarea
                      placeholder="Add any details..."
                      {...register("notes")}
                      rows={3}
                      autoFocus
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm text-[#2d3436] outline-none focus:bg-white focus:border-[#8b9dc3] focus:ring-4 focus:ring-[#8b9dc3]/10 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit — full width bottom */}
            <div className="col-span-2 pt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                  watchedPaidBy === "someone_else"
                    ? "bg-[#e17055] hover:bg-[#d16045] text-white"
                    : "bg-[#2d3436] hover:bg-[#1a1e1f] text-white"
                } disabled:bg-gray-300`}
              >
                {isSubmitting || isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Recording...
                  </>
                ) : watchedPaidBy === "someone_else" ? (
                  "Record Payable Expense"
                ) : (
                  "Record Expense"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
    </>
  )
}