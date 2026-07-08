//app/dashboard/components/ExpenseForm.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
// 🚀 Imported useRouter from next/navigation for dynamic server-side data revalidation
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
}

interface Vendor {
  id: string
  name: string
  default_category_id: string | null
  billing_cycle: string
}

interface ExpenseFormProps {
  categories: Category[]
  vendors?: Vendor[] // 🥛 Injected active vendors to support the monthly vendor tab option!
  householdId: string
  currentCycleId: string
  createdBy: string
}

type ExpenseFormData = {
  amount: number
  description: string
  category_id: string
  paid_by: "household" | "someone_else" | "pending_vendor" // 🥛 Added pending_vendor status option
  payment_account: "cash" | "card" | "personal" | "" // Can be empty if vendor tab is selected
  vendor_id: string | "" // Selected vendor link
  notes: string
}

export default function ExpenseForm({
  categories,
  vendors = [],
  householdId,
  currentCycleId,
  createdBy,
}: ExpenseFormProps) {
  const supabase = createClient()
  // 🚀 Initialized router to support server-side state revalidation
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      amount: undefined,
      description: "",
      category_id: categories[0]?.id || "",
      paid_by: "household",
      payment_account: "cash",
      vendor_id: "",
      notes: "",
    },
  })

  // Live observers to drive dynamic UI transitions
  const watchedPaidBy = watch("paid_by")
  const watchedVendorId = watch("vendor_id")

  // 🥛 Automatically pre-select default category when a vendor is chosen!
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendorId = e.target.value
    setValue("vendor_id", selectedVendorId)
    
    const selectedVendor = vendors.find(v => v.id === selectedVendorId)
    if (selectedVendor?.default_category_id) {
      setValue("category_id", selectedVendor.default_category_id)
    }
  }

async function onSubmit(data: ExpenseFormData) {
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      if (!householdId || !currentCycleId || !createdBy) {
        throw new Error("Missing active ledger configuration. Please refresh.")
      }

      // 🥛 Construct payload based on the selected financial pathway
    // 🥛 Construct payload based on the selected financial pathway
      const isVendorTab = data.paid_by === "pending_vendor"

      const payload = {
        household_id: householdId,
        cycle_id: currentCycleId,
        created_by: createdBy,
        transaction_type: "expense",
        amount: Number(data.amount),
        description: data.description.trim(),
        category_id: data.category_id || null,
        notes: data.notes.trim() || null,
        
        // 🛡️ THE FIX: Keep database enum happy by mapping it to "household" 
        // while letting payment_account: "vendor" isolate it as a pending balance!
        paid_by: isVendorTab ? "household" : data.paid_by,
        
        // Satisfies the NOT-NULL constraint we fixed earlier
        payment_account: isVendorTab ? "vendor" : data.payment_account,
        
        // Link the vendor ID to accumulate the outstanding tab balance
        vendor_id: isVendorTab && data.vendor_id ? data.vendor_id : null,
        parent_settlement_id: null,
      }

      const { error } = await supabase.from("transactions").insert([payload])

      if (error) throw new Error(error.message)

      setSubmitMessage({ text: "Expense recorded successfully!", type: "success" })
      
      // Reset form but preserve current pathway
      reset({
        amount: undefined,
        description: "",
        category_id: categories[0]?.id || "",
        paid_by: data.paid_by,
        payment_account: isVendorTab ? "cash" : data.payment_account,
        vendor_id: "",
        notes: "",
      })

      // 🚀 Refreshes Next.js server components dynamically to sync up layout stats in real-time
      router.refresh()
    } catch (err: unknown) {
      setSubmitMessage({ text: `Failed to record: ${err instanceof Error ? err.message : 'Unknown error'}`, type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">Record Expense</h2>
        <p className="text-xs text-gray-500">Log daily family consumption, bills, or periodic vendor deliveries.</p>
      </div>

      {submitMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold border ${
            submitMessage.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}
        >
          {submitMessage.type === "success" ? "✅" : "⚠️"} {submitMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Row 1: Amount & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-600 uppercase">Amount (PKR) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", {
                required: "Amount is required",
                valueAsNumber: true,
                validate: (v) => v > 0 || "Amount must be greater than zero",
              })}
              className={`w-full border p-2 rounded-lg text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-gray-900 ${
                errors.amount ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.amount && <p className="text-red-500 text-[10px] font-semibold">⚠️ {errors.amount.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-600 uppercase">Description / Item *</label>
            <input
              type="text"
              placeholder="e.g., 2 Liters Milk, Electric Bill"
              {...register("description", { required: "Description is required" })}
              className={`w-full border p-2 rounded-lg text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-gray-900 ${
                errors.description ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.description && <p className="text-red-500 text-[10px] font-semibold">⚠️ {errors.description.message}</p>}
          </div>
        </div>

        {/* Row 2: Pathway Selector - Who Paid */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-600 uppercase">Payment Arrangement *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
            <label className="flex items-center justify-center p-2 rounded-md border bg-white cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
              <input
                type="radio"
                value="household"
                {...register("paid_by")}
                className="mr-2 accent-gray-900"
              />
              <span className="text-xs font-semibold text-gray-800">House Fund</span>
            </label>

            <label className="flex items-center justify-center p-2 rounded-md border bg-white cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
              <input
                type="radio"
                value="someone_else"
                {...register("paid_by")}
                className="mr-2 accent-gray-900"
              />
              <span className="text-xs font-semibold text-gray-800">Someone Else</span>
            </label>

            <label className="flex items-center justify-center p-2 rounded-md border bg-white cursor-pointer hover:bg-gray-50 transition-all shadow-sm border-amber-200">
              <input
                type="radio"
                value="pending_vendor"
                {...register("paid_by")}
                className="mr-2 accent-amber-500"
              />
              <span className="text-xs font-semibold text-amber-700">Vendor Tab 🥛</span>
            </label>
          </div>
        </div>

        {/* Row 3: Conditional Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* A. If paid immediately via House Fund or Someone Else */}
    {/* A. If paid immediately via House Fund or Someone Else */}
          {/* 🚀 Cast to string to safely bypass strict type union comparison warning ts(2367) */}
          {(watchedPaidBy as string) !== "pending_vendor" && (
            <div className="space-y-1 animate-fadeIn">
              <label className="block text-xs font-bold text-gray-600 uppercase">Payment Source *</label>
              <select
                {...register("payment_account", {
                  required: (watchedPaidBy as string) !== "pending_vendor" ? "Payment source is required" : false,
                })}
                className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="cash">Cash Wallet</option>
                <option value="card">Bank Card</option>
                <option value="personal">Personal Account</option>
              </select>
            </div>
          )}

      {/* B. 🥛 If logged on an outstanding Monthly Vendor Tab */}
      {(watchedPaidBy as string) === "pending_vendor" && (
        <div className="space-y-1 animate-fadeIn">
          <label className="block text-xs font-bold text-amber-700 uppercase">Choose Monthly Vendor Account *</label>
          {vendors.length === 0 ? (
            <div className="p-3 border border-dashed border-amber-200 bg-amber-50/50 text-amber-800 rounded-lg text-xs font-medium text-center">
              No monthly vendors registered yet. <br />
              <span className="text-[11px] text-amber-600 font-normal">Use the ?=Add Your First Vendor Account=? button in the Vendor Panel to start.</span>
            </div>
          ) : (
            <select
              value={watchedVendorId}
              onChange={handleVendorChange}
              className="w-full bg-white border border-amber-300 p-2 rounded-lg text-sm text-amber-900 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="">-- Select Vendor Account --</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.billing_cycle})
                </option>
              ))}
            </select>
          )}
          {(watchedPaidBy as string) === "pending_vendor" && !watchedVendorId && (
            <p className="text-amber-600 text-[10px] font-semibold">⚠️ Please select a vendor to log this against.</p>
          )}
        </div>
      )}

          {/* Category Dropdown (Always displayed, but automatically pre-selected if vendor is chosen) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-600 uppercase">Expense Category</label>
            <select
              {...register("category_id")}
              className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Optional Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-600 uppercase">Notes / Memo (Optional)</label>
          <input
            type="text"
            placeholder="e.g., missed 1 liter on Monday, extra guest topup"
            {...register("notes")}
            className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || (watchedPaidBy === "pending_vendor" && !watchedVendorId)}
          className={`w-full text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm ${
            watchedPaidBy === "pending_vendor"
              ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-200"
              : "bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300"
          }`}
        >
          {isSubmitting ? "Recording..." : watchedPaidBy === "pending_vendor" ? "Add to Monthly Tab 🥛" : "Record Expense"}
        </button>

      </form>
    </div>
  )
}