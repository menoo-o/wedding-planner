// app/dashboard/savings/emergency-spend/_components/LogEmergencySpendModal.tsx
"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  ShieldAlert,
  Loader2,
  Calendar,
  AlertCircle,
  Building,
  FileText,
} from "lucide-react"
import {
  createEmergencyExpenseSchema,
  type EmergencyExpenseFormData,
  VAULT_EXPENSE_CATEGORIES,
} from "@/app/dashboard/_lib/emergency-spendSchema"
import { recordVaultExpenseAction } from "@/app/dashboard/_services/recordVaultExpense"

interface LogEmergencySpendModalProps {
  householdId: string
  availableVaultBalance: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LogEmergencySpendModal({
  householdId,
  availableVaultBalance,
  isOpen,
  onClose,
  onSuccess,
}: LogEmergencySpendModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = useMemo(
    () => createEmergencyExpenseSchema(availableVaultBalance),
    [availableVaultBalance]
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmergencyExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      payee_name: "",
      category: "medical",
      custom_category: "",
      amount: undefined,
      status: "paid",
      recurrence: "one_time",
      incurred_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  })

  const currentCategory = watch("category")
  const currentStatus = watch("status")

  if (!isOpen) return null

  const onSubmit = async (data: EmergencyExpenseFormData) => {
    setServerError(null)
    try {
      // If category is 'other', use the custom category value entered by the user
      // const finalCategory =
      //   data.category.toLowerCase() === "other" && data.custom_category
      //     ? data.custom_category.trim()
      //     : data.category

      await recordVaultExpenseAction({
        householdId,
        title: data.title,
        payeeName: data.payee_name || null,
       category: data.category, // <-- Stays typed as VaultExpenseCategory
       customCategory: data.category === "other" ? data.custom_category : null, // <-- Pass the 1-word string here
       amount: data.amount,
        status: data.status,
        dueDate: data.status === "planned" ? data.incurred_date : null,
        recurrence: data.recurrence,
        notes: data.notes || null,
      })
      reset()
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to record expense."
      )
    }
  }


return (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 sm:items-center sm:p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-spend-title"
      className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-gray-200/70 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-200 sm:rounded-2xl sm:slide-in-from-bottom-0 sm:zoom-in-95"
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <ShieldAlert size={16} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h3 id="log-spend-title" className="text-base font-semibold tracking-tight text-[#2d3436]">
              Log Emergency Spend
            </h3>
            <p className="text-xs text-gray-500">Draw funds directly from your Emergency Vault</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b9dc3]/50"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Form: scrolling body + pinned footer ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] font-medium text-[#c2492f]"
            >
              <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Title & Payee */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ls-title" className={fieldLabel}>
                Title {required}
              </label>
              <input
                id="ls-title"
                {...register("title")}
                placeholder="e.g. Hoorab ER Visit"
                aria-invalid={!!errors.title}
                className={field()}
              />
              {errors.title && <p className={fieldError}>{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="ls-payee" className={fieldLabel}>
                Payee / Facility
              </label>
              <div className="relative">
                <input
                  id="ls-payee"
                  {...register("payee_name")}
                  placeholder="e.g. Medicsi Hospital"
                  aria-invalid={!!errors.payee_name}
                  className={field("pl-9 pr-3.5")}
                />
                <Building size={14} strokeWidth={1.5} className={iconLeft} />
              </div>
              {errors.payee_name && <p className={fieldError}>{errors.payee_name.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <span id="ls-category-label" className={fieldLabel}>
              Category {required}
            </span>
            <div
              role="group"
              aria-labelledby="ls-category-label"
              className="grid grid-cols-3 gap-2 sm:grid-cols-5"
            >
              {VAULT_EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = currentCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setValue("category", cat, { shouldValidate: true })
                      if (cat !== "other") setValue("custom_category", "")
                    }}
                    className={`min-h-10 rounded-xl border px-1 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat.replace(/_/g, " ")}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom 1-word category */}
          {currentCategory?.toLowerCase() === "other" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <label htmlFor="ls-custom" className={`${fieldLabel} text-emerald-700`}>
                Custom 1-Word Category {required}
              </label>
              <input
                id="ls-custom"
                {...register("custom_category")}
                placeholder="Enter a single word"
                aria-invalid={!!errors.custom_category}
                className={field("px-3.5", toneAccent)}
              />
              <p className="mt-1.5 text-xs text-gray-500">e.g. Wedding, Travel, Appliance</p>
              {errors.custom_category && <p className={fieldError}>{errors.custom_category.message}</p>}
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label htmlFor="ls-amount" className="text-[13px] font-medium text-gray-700">
                Amount (Rs) {required}
              </label>
              <span className="text-xs text-gray-500">
                Vault:{" "}
                <span className="font-semibold tabular-nums text-[#2d3436]">
                  Rs {availableVaultBalance.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                Rs
              </span>
              <input
                id="ls-amount"
                type="number"
                inputMode="decimal"
                step="any"
                {...register("amount", { valueAsNumber: true })}
                placeholder="14000"
                aria-invalid={!!errors.amount}
                className={`${field("pl-10 pr-3.5")} font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
            </div>
            {errors.amount && <p className={fieldError}>{errors.amount.message}</p>}
          </div>

          {/* Status & Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span id="ls-status-label" className={fieldLabel}>
                Payment Status
              </span>
              <div
                role="group"
                aria-labelledby="ls-status-label"
                className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-gray-200/70 bg-gray-100/80 p-1 sm:h-10"
              >
                {(
                  [
                    { value: "paid", label: "Paid Now" },
                    { value: "planned", label: "Planned" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={currentStatus === value}
                    onClick={() => setValue("status", value, { shouldValidate: true })}
                    className={`rounded-lg text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${
                      currentStatus === value
                        ? "bg-white text-[#2d3436] shadow-sm"
                        : "text-gray-600 hover:text-[#2d3436]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ls-date" className={fieldLabel}>
                {currentStatus === "planned" ? "Target Due Date" : "Payment Date"}
              </label>
              <div className="relative">
                <input
                  id="ls-date"
                  type="date"
                  {...register("incurred_date")}
                  className={field("pl-9 pr-3")}
                />
                <Calendar size={14} strokeWidth={1.5} className={iconLeft} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="ls-notes" className={fieldLabel}>
              Notes <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="ls-notes"
                {...register("notes")}
                placeholder="e.g. Stomach flu consultation & tests"
                className={field("pl-9 pr-3.5")}
              />
              <FileText size={14} strokeWidth={1.5} className={iconLeft} />
            </div>
          </div>
        </div>

        {/* ── Pinned footer ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl px-4 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b9dc3]/50 sm:h-10 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-emerald-700 hover:to-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:flex-none"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Confirm &amp; Save
          </button>
        </div>
      </form>
    </div>
  </div>
)
}


const fieldBase =
  "h-11 w-full min-w-0 rounded-xl border text-base font-medium text-[#2d3436] outline-hidden transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 sm:h-10 sm:text-sm"
const toneNeutral = "border-gray-200 bg-gray-50"
const toneAccent = "border-emerald-200 bg-emerald-50/40"
const field = (pad = "px-3.5", tone = toneNeutral) => `${fieldBase} ${tone} ${pad}`

const fieldLabel = "mb-1.5 block text-[13px] font-medium text-gray-700"
const fieldError = "mt-1.5 text-xs font-medium text-[#c2492f]"
const iconLeft = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
const required = <span className="text-[#c2492f]">*</span>