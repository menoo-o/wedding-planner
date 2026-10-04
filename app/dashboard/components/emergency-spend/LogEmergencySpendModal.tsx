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
   <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150 sm:items-center sm:p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-spend-title"
      className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-200 sm:rounded-[2rem] sm:slide-in-from-bottom-0 sm:zoom-in-95"
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:px-10 sm:py-6">
        <div className="min-w-0">
          <h3 id="log-spend-title" className="text-xl font-semibold tracking-tight text-[#2d3436]">
            Log Emergency Spend
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Draw funds directly from your Emergency Vault
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8b9dc3]/25"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Form: scrolling body + pinned footer ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
          {serverError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-[13px] font-medium text-[#c2492f]"
            >
              <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {/* ── Left column ── */}
            <div className="space-y-6">
              <div>
                <label htmlFor="ls-title" className={fieldLabel}>
                  Title{required}
                </label>
                <input
                  id="ls-title"
                  {...register("title")}
                  placeholder="e.g. Hoorab ER Visit"
                  aria-invalid={!!errors.title}
                  className={fieldBase}
                />
                {errors.title && <p className={fieldError}>{errors.title.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <label
                    htmlFor="ls-amount"
                    className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                  >
                    Amount (Rs){required}
                  </label>
                  <span className="text-xs text-gray-500">
                    Vault:{" "}
                    <span className="font-semibold tabular-nums text-[#2d3436]">
                      Rs {availableVaultBalance.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400">
                    Rs
                  </span>
                  <input
                    id="ls-amount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    {...register("amount", { valueAsNumber: true })}
                    placeholder="0.00"
                    aria-invalid={!!errors.amount}
                    className={`${fieldBase} pl-14 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  />
                </div>
                {errors.amount && <p className={fieldError}>{errors.amount.message}</p>}
              </div>

              <div>
                <span id="ls-status-label" className={fieldLabel}>
                  Payment Status
                </span>
                <div role="group" aria-labelledby="ls-status-label" className="grid grid-cols-2 gap-3">
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
                      className={`h-12 sm:h-14 ${optionBase} ${
                        currentStatus === value ? optionOn : optionOff
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-6">
              <div>
                <span id="ls-category-label" className={fieldLabel}>
                  Category{required}
                </span>
                <div
                  role="group"
                  aria-labelledby="ls-category-label"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
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
                        className={`h-11 px-2 capitalize ${optionBase} ${
                          isSelected ? optionOn : optionOff
                        }`}
                      >
                        {cat.replace(/_/g, " ")}
                      </button>
                    )
                  })}
                </div>

                {currentCategory?.toLowerCase() === "other" && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label htmlFor="ls-custom" className={fieldLabel}>
                      Custom 1-Word Category{required}
                    </label>
                    <input
                      id="ls-custom"
                      {...register("custom_category")}
                      placeholder="e.g. Wedding, Travel, Appliance"
                      aria-invalid={!!errors.custom_category}
                      className={fieldBase}
                    />
                    {errors.custom_category && (
                      <p className={fieldError}>{errors.custom_category.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="ls-payee" className={fieldLabel}>
                  Payee / Facility
                </label>
                <input
                  id="ls-payee"
                  {...register("payee_name")}
                  placeholder="e.g. Medicsi Hospital"
                  aria-invalid={!!errors.payee_name}
                  className={fieldBase}
                />
                {errors.payee_name && <p className={fieldError}>{errors.payee_name.message}</p>}
              </div>

              <div>
                <label htmlFor="ls-date" className={fieldLabel}>
                  {currentStatus === "planned" ? "Target Due Date" : "Payment Date"}
                </label>
                <input
                  id="ls-date"
                  type="date"
                  {...register("incurred_date")}
                  className={fieldBase}
                />
              </div>
            </div>

            {/* ── Notes (full width) ── */}
            <div className="md:col-span-2">
              <label htmlFor="ls-notes" className={fieldLabel}>
                Notes <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="ls-notes"
                {...register("notes")}
                placeholder="e.g. Stomach flu consultation & tests"
                className={fieldBase}
              />
            </div>
          </div>
        </div>

        {/* ── Pinned footer ── */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-10">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2d3436] text-[15px] font-semibold text-white transition-all hover:bg-[#1f2526] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d3436]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Confirm &amp; Save
          </button>
        </div>
      </form>
    </div>
  </div>
)
}

// ── Form tokens (same look as the Add Expense modal) ──
const fieldBase =
  "h-12 w-full min-w-0 rounded-2xl border border-transparent bg-gray-50 px-5 text-base font-medium text-[#2d3436] outline-hidden transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-[#8b9dc3] focus:bg-white focus:ring-4 focus:ring-[#8b9dc3]/15 aria-invalid:border-[#c2492f]/50 sm:h-14"
const fieldLabel =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
const fieldError = "mt-2 text-xs font-medium text-[#c2492f]"
const optionOn = "border-[#2d3436] bg-[#2d3436] text-white"
const optionOff = "border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50"
const optionBase =
  "rounded-2xl border text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8b9dc3]/25"
const required = <span aria-hidden> *</span>