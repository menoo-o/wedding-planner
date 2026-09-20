// app/dashboard/components/modals/AddExpenseModal.tsx
"use client"

import { useState, useTransition, useEffect } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import {
  X,
  Plus,
  Wallet,
  CreditCard,
  Tag,
  Loader2,
  Check,
  ChevronDown,
  User,
} from "lucide-react"

import { expenseSchema, ExpenseFormData } from "@/app/dashboard/_lib/addExpenseSchema"


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
  showToast: (type: "success" | "error" | "info", title: string, message: string) => void
  onCategoryCreated: (category: Category) => void
}
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
  showToast,
  onCategoryCreated,
}: AddExpenseModalProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
    resolver: zodResolver(expenseSchema), // ← Add Zod resolver
    defaultValues: {
      amount: undefined,
      description: "",
      category_id: "",
      paid_by: "household",
      payment_account: undefined,
      counterparty_name: "",
      notes: "",
    },
  })

   const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock page scroll behind the modal
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const watchedPaidBy = watch("paid_by")
  const watchedPaymentAccount = watch("payment_account")
  const watchedCategory = watch("category_id")

  // Auto-set payment_account when paid_by changes
  useEffect(() => {
    if (watchedPaidBy === "someone_else") {
      setValue("payment_account", null)
      setValue("counterparty_name", "")
    } else {
      setValue("payment_account", "cash")
      setValue("counterparty_name", "")
    }
  }, [watchedPaidBy, setValue])

  // ── Submit Expense ─────────────────────────────────────────
async function onSubmit(data: ExpenseFormData) {
  if (!householdId || !currentCycleId || !createdBy) {
    showToast("error", "Configuration Error", "Missing active ledger. Please refresh.")
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
          notes: data.notes?.trim() || null,
          paid_by: data.paid_by,
          payment_account: isSomeoneElse ? null : data.payment_account,
          counterparty_name: isSomeoneElse ? data.counterparty_name?.trim() || null : null,
          reimbursement_status: isSomeoneElse ? "pending" : null,
          loan_status: null,
          vendor_id: null,
          // parent_settlement_id: null,
        }

        const { error } = await supabase.from("transactions").insert([payload])

        if (error) throw new Error(error.message)

        // Reset form explicitly back to default placeholder state
        reset({
          amount: undefined,
          description: "",
          category_id: "",
          paid_by: "household",
          payment_account: "cash",
          counterparty_name: "",
          notes: "",
        })

        showToast(
          "success",
          "Expense Recorded",
          isSomeoneElse
            ? `${data.description} — Rs ${data.amount.toLocaleString()} (owed to ${data.counterparty_name})`
            : `${data.description} — Rs ${data.amount.toLocaleString()}`
        )

  // 2. Immediately close and refresh server components
          onClose()
          router.refresh()
        } catch (err: unknown) {
          showToast("error", "Failed to Record", err instanceof Error ? err.message : "Something went wrong")
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
        showToast("error", "Category Failed", error.message)
        return
      }

      if (data) {
        onCategoryCreated(data)
        setValue("category_id", data.id)
        setNewCategoryName("")
        setIsAddingCategory(false)
        showToast ("success", "Category Created", `"${data.name}" is now available`)
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
      bg: "bg-emerald-50",
    },
    {
      value: "card" as const,
      label: "Card",
      balance: cardBalance,
      icon: <CreditCard size={16} strokeWidth={1.5} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ]

  if (!mounted || !isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2d3436]/30 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal: bottom sheet on mobile, centered dialog from sm up */}
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add expense"
          className="pointer-events-auto flex w-full max-h-[94dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_25px_80px_-20px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-8 duration-300 sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-[2rem] sm:zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-50 px-5 py-4 sm:px-8 sm:py-6">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#2d3436] sm:text-xl">Add Expense</h2>
              <p className="mt-0.5 text-xs text-gray-400 sm:mt-1 sm:text-sm">
                {watchedPaidBy === "someone_else"
                  ? "Record an expense paid by someone else"
                  : "Record a new household expense"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Form: scrollable body + pinned submit footer */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:p-8">
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 sm:gap-y-6">
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
                          {...register("amount", { valueAsNumber: true })}
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
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                          Description *
                        </label>
                        <span className="text-[11px] font-medium text-gray-400">
                          {(watch("description")?.length || 0)}/120
                        </span>
                      </div>

                      <input
                        type="text"
                        maxLength={120}
                        placeholder="What did you spend on?"
                        {...register("description")}
                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-2xl text-base sm:text-sm font-medium text-[#2d3436] outline-none transition-all focus:bg-white focus:ring-4 ${
                          errors.description
                            ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/10"
                            : "border-transparent focus:border-[#8b9dc3] focus:ring-[#8b9dc3]/10"
                        }`}
                      />
                      {errors.description && (
                        <p className="text-red-500 text-xs font-medium px-1">
                          {errors.description.message}
                        </p>
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
                            className={`flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border-2 cursor-pointer transition-all ${
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
                      {errors.paid_by && (
                        <p className="text-red-500 text-xs font-medium">{errors.paid_by.message}</p>
                      )}
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
                            {...register("counterparty_name")}
                            className="w-full pl-11 pr-4 py-3.5 bg-[#e17055]/5 border-2 border-[#e17055]/20 rounded-2xl text-base sm:text-sm font-medium text-[#2d3436] outline-none focus:ring-4 focus:ring-[#e17055]/10"
                          />
                        </div>
                        {errors.counterparty_name && (
                          <p className="text-red-500 text-xs font-medium">
                            {errors.counterparty_name.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          You will owe them Rs {watch("amount") || 0}
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
                              className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                watchedPaymentAccount === option.value
                                  ? "border-[#8b9dc3] bg-[#8b9dc3]/5"
                                  : "border-gray-100 bg-white hover:border-gray-200"
                              }`}
                            >
                              <input
                                type="radio"
                                value={option.value}
                                {...register("payment_account", {
                                  required: watchedPaidBy === "household" ? "Please select a payment account" : false,
                                })}
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
                        {errors.payment_account && (
                          <p className="text-red-500 text-xs font-medium">
                            {errors.payment_account.message}
                          </p>
                        )}
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
                            className="min-w-0 flex-1 px-4 py-3 bg-[#8b9dc3]/5 border-2 border-[#8b9dc3]/20 rounded-2xl text-base sm:text-sm font-medium outline-none focus:ring-4 focus:ring-[#8b9dc3]/10"
                          />
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim() || isPending}
                            className="shrink-0 px-4 sm:px-5 py-3 bg-[#8b9dc3] hover:bg-[#7a8bb2] disabled:bg-gray-200 text-white rounded-2xl text-sm font-semibold transition-colors"
                          >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Add"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCategory(false)
                              setNewCategoryName("")
                            }}
                            className="shrink-0 px-3.5 sm:px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl transition-colors"
                          >
                            <X size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                       <div className="relative">
                        <Tag
                          size={16}
                          className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                            watchedCategory ? "text-[#8b9dc3]" : "text-gray-400"
                          }`}
                        />
                        <select
                          {...register("category_id")}
                          defaultValue=""
                          className={`peer w-full pl-11 pr-10 py-3.5 border-2 rounded-2xl text-base sm:text-sm font-medium outline-none appearance-none transition-all focus:bg-white focus:ring-4 ${
                            watchedCategory
                              ? "bg-[#8b9dc3]/5 text-[#2d3436]"
                              : "bg-gray-50 text-gray-400"
                          } ${
                            errors.category_id
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                              : watchedCategory
                              ? "border-[#8b9dc3]/30 focus:border-[#8b9dc3] focus:ring-[#8b9dc3]/10"
                              : "border-transparent focus:border-[#8b9dc3] focus:ring-[#8b9dc3]/10"
                          }`}
                        >
                          <option value="" disabled hidden>
                            Choose a category
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id} className="text-[#2d3436]">
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 peer-focus:rotate-180 peer-focus:text-[#8b9dc3]"
                        />
                      </div>
                          {errors.category_id && (
                            <p className="text-xs text-red-500 font-medium px-1">
                              {errors.category_id.message as string}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

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
                                setValue("notes", "")
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
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-base sm:text-sm text-[#2d3436] outline-none focus:bg-white focus:border-[#8b9dc3] focus:ring-4 focus:ring-[#8b9dc3]/10 resize-none"
                          />
                          {errors.notes && (
                            <p className="text-red-500 text-xs font-medium">{errors.notes.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

              </div>
            </div>

            {/* Submit: always visible, clear of the home indicator */}
            <div className="shrink-0 border-t border-gray-100 bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-4 sm:pb-6">
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold tracking-wide transition-all ${
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
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}