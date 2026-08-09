"use client"
// app/dashboard/components/ReceivablesList.tsx

import React, { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { ReceivableRecord } from "@/lib/types"
import Toast, { useToast } from "./Toast"

// ── Props ─────────────────────────────────────────────────────

interface ReceivablesListProps {
  records: ReceivableRecord[]
  householdId: string
  currentCycleId: string        // ← CHANGED: required (was optional)
  createdBy: string
  cashBalance: number      // ← NEW: for liquidity guard
  cardBalance: number      // ← NEW: for liquidity guard
}

interface CollectionFormValues {
  collected_amount: number
  payment_account: "cash" | "card"  // ← user chooses where money lands
}

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", minimumFractionDigits: 0,
  }).format(val)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

const STATUS_STYLES: Record<ReceivableRecord["loan_status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-blue-50 text-blue-700 border-blue-200",
  settled: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

// ── Component ─────────────────────────────────────────────────
// ── Component ─────────────────────────────────────────────────

export default function ReceivablesList({
  records = [],
  householdId,
  currentCycleId,      // ← now guaranteed to be a string
  createdBy,
  cashBalance,
  cardBalance,
}: ReceivablesListProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedLoan, setSelectedLoan] = useState<ReceivableRecord | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const { toast, show, dismiss } = useToast()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<CollectionFormValues>({
      defaultValues: {
        collected_amount: undefined,
        payment_account: "cash",
      }
    })

  const selectedPaymentAccount = watch("payment_account")
  // const watchedAmount = watch("collected_amount")

  const onSubmitCollection = async (data: CollectionFormValues) => {
    if (!selectedLoan) return
    setLocalError(null)

    const inputAmt = Number(data.collected_amount)

    // Guard: block over-collecting
    if (inputAmt > selectedLoan.remaining_amount) {
      setLocalError(
        `❌ Excessive Entry! You cannot collect ${formatCurrency(inputAmt)} because the outstanding ` +
        `balance on this asset is only ${formatCurrency(selectedLoan.remaining_amount)}.`
      )
      return
    }

    startTransition(async () => {
      // Step A: Insert loan_return with USER-CHOSEN payment_account
      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          household_id:           householdId,
          cycle_id:               currentCycleId,   // ← CHANGED: direct, no ?? null
          created_by:             createdBy,
          transaction_type:       "loan_return",
          payment_account:        data.payment_account,
          amount:                 inputAmt,
          counterparty_name:      selectedLoan.counterparty_name,
          description:            `Collected ${data.payment_account.toUpperCase()}: Repayment of ${formatCurrency(inputAmt)} from ${selectedLoan.counterparty_name ?? "Borrower"}`,
          notes:                  `Linked to parent asset loan ID: ${selectedLoan.id}. Originally lent via ${selectedLoan.payment_account}.`,
          paid_by:                null,
          category_id:            null,
          related_transaction_id: selectedLoan.id,
        })

      if (insertError) {
        show("error", "Collection Failed", `Could not record collection: ${insertError.message}`)
        return
      }

      // Step B: Update parent loan status
      const nextStatus: ReceivableRecord["loan_status"] =
        inputAmt === selectedLoan.remaining_amount ? "settled" : "partial"

      const { error: updateError } = await supabase
        .from("transactions")
        .update({ loan_status: nextStatus })
        .eq("id", selectedLoan.id)

      if (updateError) {
        show("error", "Status Update Failed", `Collection saved but status not updated: ${updateError.message}`)
        return
      }

      // Success toast
      const borrower = selectedLoan.counterparty_name ?? "Borrower"
      const isFull = inputAmt === selectedLoan.remaining_amount
      show(
        "success",
        isFull ? "Loan Fully Collected!" : "Partial Collection Recorded",
        isFull
          ? `Received ${formatCurrency(inputAmt)} from ${borrower} into ${data.payment_account.toUpperCase()}. Loan fully settled.`
          : `Received ${formatCurrency(inputAmt)} from ${borrower} into ${data.payment_account.toUpperCase()}. Remaining: ${formatCurrency(selectedLoan.remaining_amount - inputAmt)}.`
      )

      setSelectedLoan(null)
      reset()
      router.refresh()
    })
  }

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />

      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Active Receivables Log</h3>
            <p className="text-xs text-gray-500">Unsettled household assets currently outstanding.</p>
          </div>
          <span className="bg-amber-50 text-amber-700 border border-amber-100 font-bold text-xs px-2.5 py-1 rounded-full">
            {records.length} Pending Collection{records.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Collection Form */}
        {selectedLoan && (
          <div className="bg-slate-50 border-2 border-emerald-600 rounded-xl p-4 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Record Collection: {selectedLoan.counterparty_name || "Unknown Borrower"}
              </h4>
              <p className="text-[11px] text-slate-500">
                Outstanding: <span className="font-bold text-slate-700">{formatCurrency(selectedLoan.remaining_amount)}</span>
                {" · "}Originally lent via: <span className="font-bold text-amber-600 uppercase">{selectedLoan.payment_account}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitCollection)} className="flex flex-col gap-3">
              {/* Payment Method Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-600">Receive Payment In *</label>
                <div className="flex gap-2">
                  {(["cash", "card"] as const).map((method) => (
                    <label
                      key={method}
                      className={`flex-1 cursor-pointer rounded-lg border-2 p-2 text-center transition-all ${
                        selectedPaymentAccount === method
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={method}
                        {...register("payment_account", { required: true })}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold uppercase">{method}</span>
                      <span className="block text-[10px] opacity-70 mt-0.5">
                        {method === "cash" ? formatCurrency(cashBalance) : formatCurrency(cardBalance)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-1 max-w-xs">
                <label className="text-[11px] font-bold text-slate-600">Amount Collected (PKR) *</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...register("collected_amount", {
                      required: "Please specify an amount to collect.",
                      valueAsNumber: true,
                      validate: (v) => v > 0 || "Collection amount must be greater than zero."
                    })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none font-semibold focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setValue("collected_amount", selectedLoan.remaining_amount)}
                    className="absolute right-2 px-2 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold transition-colors"
                  >
                    Collect Full
                  </button>
                </div>
                {errors.collected_amount && (
                  <p className="text-red-600 text-[11px] font-medium mt-0.5">{errors.collected_amount.message}</p>
                )}
              </div>

              {localError && (
                <p className="text-red-600 text-xs font-semibold leading-relaxed">{localError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:bg-slate-300"
                >
                  {isPending ? "Processing..." : "Confirm Collection"}
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedLoan(null); setLocalError(null); reset(); }}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {records.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50 border border-dashed rounded-lg">
            Clear ledger — no outstanding receivables.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                  <th className="py-2.5 px-3">Date Lent</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Outstanding</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {records.map((tx) => {
                  const isPartial = tx.loan_status === "partial"
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-500 whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900">
                        {tx.counterparty_name ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs truncate" title={tx.description ?? ""}>
                        {tx.description ?? "Lent funds"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 border text-[10px] rounded font-bold uppercase bg-amber-50 text-amber-700 border-amber-100">
                          {tx.payment_account}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 border text-[10px] rounded-md font-bold capitalize ${STATUS_STYLES[tx.loan_status]}`}>
                          {tx.loan_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-black tracking-tight text-amber-600 block">
                          {formatCurrency(tx.remaining_amount)}
                        </span>
                        {isPartial && (
                          <span className="text-[10px] text-gray-400">
                            of {formatCurrency(tx.amount)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedLoan(tx); setLocalError(null); }}
                          disabled={isPending}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {isPending ? "Saving…" : isPartial ? "Collect Rest" : "Collect"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}