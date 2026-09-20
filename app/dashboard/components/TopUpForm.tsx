// app/dashboard/components/TopUpForm.tsx
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Wallet, CreditCard, Info, Plus } from "lucide-react"
import { TopUpFormSchema, TopUpFormData, TransactionInsertSchema } from "@/app/dashboard/_lib/topUpFormSchema"

import {
  labelCls, errorCls, inputCls, dateFixCls,
  optionGridCls, optionCls, cancelBtnCls, submitBtnCls,
} from "@/app/dashboard/_lib/formStyles"

function getTodayString() {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

interface TopUpFormProps {
  householdId: string
  currentCycleId: string
  createdBy: string
  onSuccess?: () => void
 showToast: (type: "success" | "error" | "info", title: string, message: string) => void
}

export default function TopUpForm({
  householdId,
  currentCycleId,
  createdBy,
  onSuccess,
  showToast,
}: TopUpFormProps) {
  const supabase = createClient()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TopUpFormData>({
    resolver: zodResolver(TopUpFormSchema),
    defaultValues: {
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined as unknown as number,
      description: "",
      transaction_date: getTodayString(),
      payment_account: "cash",
    },
  })

  

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
    }))
  }, [householdId, currentCycleId, createdBy, reset])

  async function onSubmit(data: TopUpFormData) {
    // 1. Validate payload with schema
    const parsed = TopUpFormSchema.safeParse(data)
    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.issues)
      showToast("error", "Validation Failed", "Please check your input and try again.")
      return
    }

    // 2. Build timestamp
    const chosenDate = new Date(data.transaction_date)
    const now = new Date()
    if (data.transaction_date === getTodayString()) {
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      chosenDate.setHours(12, 0, 0)
    }

    // 3. Build database payload
    const payload = {
      household_id: data.household_id,
      cycle_id: data.cycle_id,
      created_by: data.created_by,
      transaction_type: "top_up" as const,
      amount: data.amount,
      description: data.description.trim(),
      created_at: chosenDate.toISOString(),
      payment_account: data.payment_account,
      category_id: null,
      counterparty_name: null,
      paid_by: null,
      notes: null,
    }

    const txParsed = TransactionInsertSchema.safeParse(payload)
    if (!txParsed.success) {
      console.error("Payload validation failed:", txParsed.error.issues)
      showToast("error", "Payload Validation Failed", "Please check your input and try again.")
      return
    }

    // 4. Insert into Supabase
    const { error } = await supabase.from("transactions").insert(txParsed.data)

    if (error) {
      console.error("Supabase Write Error:", error.message)
      showToast("error", "Failed to Record", error.message)
      return
    }

    // ✅ 5. Trigger success toast
    showToast(
      "success",
      "Top-Up Added",
      `Rs ${Number(data.amount).toLocaleString()} added to ${data.payment_account.toUpperCase()}`
    )

    reset({
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined as unknown as number,
      description: "",
      transaction_date: getTodayString(),
      payment_account: "cash",
    })

    // 6. Close modal and revalidate server data
    onSuccess?.()
    router.refresh()
  }

  const selectedAccount = watch("payment_account")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("household_id")} />
      <input type="hidden" {...register("cycle_id")} />
      <input type="hidden" {...register("created_by")} />

      {/* Date */}
      <div className="space-y-2">
        <label className={labelCls}>Date</label>
        <input
          type="date"
          {...register("transaction_date")}
          suppressHydrationWarning
          className={`${inputCls(!!errors.transaction_date)} ${dateFixCls}`}
        />
        {errors.transaction_date && <p className={errorCls}>{errors.transaction_date.message}</p>}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className={labelCls}>Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-400 pointer-events-none">
            Rs
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            autoFocus
            {...register("amount", { valueAsNumber: true })}
            className={`${inputCls(!!errors.amount, "pl-14 pr-4", "h-14")} !text-xl font-bold tabular-nums`}
          />
        </div>
        {errors.amount ? (
          <p className={errorCls}>{errors.amount.message}</p>
        ) : (
          <div className="flex items-center gap-1.5 px-1">
            <Info size={12} strokeWidth={1.8} className="text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400">Deposit must be greater than 0</span>
          </div>
        )}
      </div>

      {/* Destination Account */}
      <div className="space-y-2">
        <label className={labelCls}>Destination account</label>
        <div className={optionGridCls} role="radiogroup" aria-label="Destination account">
          <button
            type="button"
            role="radio"
            aria-checked={selectedAccount === "cash"}
            onClick={() => setValue("payment_account", "cash")}
            className={optionCls(selectedAccount === "cash")}
          >
            <Wallet size={16} strokeWidth={1.8} />
            Cash wallet
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedAccount === "card"}
            onClick={() => setValue("payment_account", "card")}
            className={optionCls(selectedAccount === "card")}
          >
            <CreditCard size={16} strokeWidth={1.8} />
            Bank card
          </button>
        </div>
        {errors.payment_account && <p className={errorCls}>{errors.payment_account.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className={labelCls}>Source / description</label>
        <input
          type="text"
          placeholder="e.g. Monthly salary, cash injection..."
          {...register("description")}
          className={inputCls(!!errors.description)}
        />
        {errors.description && <p className={errorCls}>{errors.description.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onSuccess} className={cancelBtnCls}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className={submitBtnCls}>
          {isSubmitting ? (
            "Processing..."
          ) : (
            <>
              <Plus size={16} strokeWidth={1.8} />
              Add deposit
            </>
          )}
        </button>
      </div>
    </form>
  )
}