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
      const finalCategory =
        data.category.toLowerCase() === "other" && data.custom_category
          ? data.custom_category.trim()
          : data.category

      await recordVaultExpenseAction({
        householdId,
        title: data.title,
        payeeName: data.payee_name || null,
        category: finalCategory,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2d3436]">
                Log Emergency Spend
              </h3>
              <p className="text-[11px] text-gray-400">
                Draw funds directly from your Emergency Vault
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Form Body ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto p-6 space-y-4 flex-1"
        >
          {serverError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs font-medium text-[#e17055] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Title & Payee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                {...register("title")}
                placeholder="e.g. Hoorab ER Visit"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-semibold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
              />
              {errors.title && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Payee / Facility
              </label>
              <div className="relative">
                <input
                  {...register("payee_name")}
                  placeholder="e.g. Medicsi Hospital"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-semibold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
                />
                <Building
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.payee_name && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">
                  {errors.payee_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Category Badges */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {VAULT_EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = currentCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setValue("category", cat, { shouldValidate: true })
                      if (cat !== "other") setValue("custom_category", "")
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border capitalize transition-all ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-gray-50 border-gray-200/80 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat.replace("_", " ")}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Conditional 1-Word Custom Category Input ── */}
          {currentCategory?.toLowerCase() === "other" && (
            <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-emerald-700 text-[11px]">
                  Custom 1-Word Category <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">
                  e.g. Wedding, Travel, Appliance
                </span>
              </div>
              <input
                {...register("custom_category")}
                placeholder="Enter single word (e.g. Wedding)"
                className="w-full px-3.5 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs font-bold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all placeholder:font-normal placeholder:text-gray-400"
              />
              {errors.custom_category && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">
                  {errors.custom_category.message}
                </p>
              )}
            </div>
          )}

          {/* Amount & Vault Balance Banner */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold text-gray-600">
                Amount (Rs) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">
                Vault:{" "}
                <span className="font-bold text-[#2d3436]">
                  Rs {availableVaultBalance.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                Rs
              </span>
              <input
                type="number"
                step="any"
                {...register("amount", { valueAsNumber: true })}
                placeholder="14000"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-sm font-bold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
              />
            </div>
            {errors.amount && (
              <p className="text-[10px] text-rose-500 mt-1 font-medium">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Status & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Payment Status
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    setValue("status", "paid", { shouldValidate: true })
                  }
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    currentStatus === "paid"
                      ? "bg-white text-[#2d3436] shadow-xs"
                      : "text-gray-500"
                  }`}
                >
                  Paid Now
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValue("status", "planned", { shouldValidate: true })
                  }
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    currentStatus === "planned"
                      ? "bg-white text-[#2d3436] shadow-xs"
                      : "text-gray-500"
                  }`}
                >
                  Planned
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {currentStatus === "planned" ? "Target Due Date" : "Payment Date"}
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register("incurred_date")}
                  className="w-full pl-8 pr-3.5 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-semibold text-[#2d3436] focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
                />
                <Calendar
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Notes (Optional)
            </label>
            <div className="relative">
              <input
                {...register("notes")}
                placeholder="e.g. Stomach flu consultation & tests"
                className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-[#2d3436] placeholder-gray-400 focus:bg-white focus:border-emerald-600 outline-hidden transition-all"
              />
              <FileText
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* ── Modal Footer ── */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              Confirm & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}