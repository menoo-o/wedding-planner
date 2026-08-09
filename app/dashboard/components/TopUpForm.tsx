// app/dashboard/components/TopUpForm.tsx
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Wallet, CreditCard, Info, Plus } from "lucide-react"

type TopUpFormData = {
  household_id: string
  cycle_id: string
  created_by: string
  amount: number
  description: string
  transaction_date: string
  payment_account: "cash" | "card"
}

function getTodayString() {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

interface TopUpFormProps {
  householdId: string
  currentCycleId: string
  createdBy: string
  onSuccess?: () => void
}

export default function TopUpForm({
  householdId,
  currentCycleId,
  createdBy,
  onSuccess,
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
    defaultValues: {
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined,
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
    if (!data.cycle_id || !data.household_id) {
      console.error("Missing active ledger identifiers.")
      return
    }

    const chosenDate = new Date(data.transaction_date)
    const now = new Date()

    if (data.transaction_date === getTodayString()) {
      chosenDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    } else {
      chosenDate.setHours(12, 0, 0)
    }

    const cleanPayload = {
      household_id: data.household_id,
      cycle_id: data.cycle_id,
      created_by: data.created_by,
      transaction_type: "top_up",
      amount: data.amount,
      description: data.description.trim(),
      created_at: chosenDate.toISOString(),
      payment_account: data.payment_account,
      category_id: null,
      counterparty_name: null,
      paid_by: null,
      notes: null,
    }

    const { error } = await supabase.from("transactions").insert(cleanPayload)

    if (error) {
      console.error("Supabase Write Error:", error.message)
      return
    }

    reset({
      household_id: householdId,
      cycle_id: currentCycleId,
      created_by: createdBy,
      amount: undefined,
      description: "",
      transaction_date: getTodayString(),
      payment_account: "cash",
    })

    onSuccess?.()
    router.refresh()
  }

  const selectedAccount = watch("payment_account")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("household_id")} />
      <input type="hidden" {...register("cycle_id")} />
      <input type="hidden" {...register("created_by")} />

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
        <input
          type="date"
          {...register("transaction_date", { required: "Date is required" })}
          suppressHydrationWarning
          className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-[15px] text-[#2d3436] outline-none focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04] transition-all"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-gray-400 pointer-events-none">
            Rs
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            autoFocus
            {...register("amount", {
              required: "Amount is required",
              valueAsNumber: true,
              validate: (val) => val > 0 || "Deposit must be greater than 0",
            })}
            className={`w-full h-[52px] pl-11 pr-3.5 border rounded-xl text-[22px] font-medium tabular-nums outline-none transition-all ${
              errors.amount
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04]"
            }`}
          />
        </div>
        {errors.amount ? (
          <p className="text-red-500 text-xs mt-1.5">{errors.amount.message}</p>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Info size={12} strokeWidth={1.8} className="text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400">Deposit must be greater than 0</span>
          </div>
        )}
      </div>

      {/* Destination Account */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Destination account
        </label>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setValue("payment_account", "cash")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
              selectedAccount === "cash"
                ? "bg-white text-[#2d3436] shadow-sm"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <Wallet size={16} strokeWidth={1.8} />
            Cash wallet
          </button>
          <button
            type="button"
            onClick={() => setValue("payment_account", "card")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
              selectedAccount === "card"
                ? "bg-white text-[#2d3436] shadow-sm"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            <CreditCard size={16} strokeWidth={1.8} />
            Bank card
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Source / description
        </label>
        <input
          type="text"
          placeholder="e.g. Monthly salary, cash injection..."
          {...register("description", {
            required: "Please describe the source of this funding",
          })}
          className={`w-full h-11 px-3.5 border rounded-xl text-[15px] outline-none transition-all ${
            errors.description
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 focus:border-[#2d3436] focus:ring-[3px] focus:ring-black/[0.04]"
          }`}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1.5">{errors.description.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 font-medium text-sm transition-all border border-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 rounded-xl bg-[#2d3436] hover:opacity-90 disabled:opacity-40 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5"
        >
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