// app/dashboard/components/ReceivablesList.tsx
"use client"

import React, { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

// ── Types ─────────────────────────────────────────────────────

export interface ReceivableRecord {
  id: string
  amount: number
  remaining_amount: number                                    // outstanding after partial repayments
  loan_status: "pending" | "partial" | "settled"              //
  transaction_type: string                                    //
  payment_account: "cash" | "card" | "personal"               //
  counterparty_name: string | null                            //
  description: string | null                                  //
  created_at: string                                          //
  notes: string | null                                        //
  related_transaction_id: string | null                      //
}

interface ReceivablesListProps {
  records: ReceivableRecord[]
  householdId: string
  currentCycleId: string
  createdBy: string
}

interface CollectionFormValues {
  collected_amount: number
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
  pending: "bg-amber-50 text-amber-700 border-amber-200",     //
  partial: "bg-blue-50 text-blue-700 border-blue-200",       //
  settled: "bg-emerald-50 text-emerald-700 border-emerald-200", //
}

// ── Component ─────────────────────────────────────────────────

export default function ReceivablesList({
  records = [],
  householdId,
  currentCycleId,
  createdBy,
}: ReceivablesListProps) {
  const supabase = createClient()                             //
  const router = useRouter()                                   //
  const [isPending, startTransition] = useTransition()         //

  // Track the active row selected for partial/full collection
  const [selectedLoan, setSelectedLoan] = useState<ReceivableRecord | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Initialize React Hook Form for collection entries
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CollectionFormValues>({
    defaultValues: {
      collected_amount: undefined
    }
  })

  // ── Collection Engine Logic ─────────────────────────────────
  const onSubmitCollection = async (data: CollectionFormValues) => {
    if (!selectedLoan) return
    setLocalError(null)

    const inputAmt = Number(data.collected_amount)

    // 🏆 GUARD RAIL: Block over-collecting funds
    if (inputAmt > selectedLoan.remaining_amount) {
      setLocalError(
        `❌ Excessive Entry! You cannot collect ${formatCurrency(inputAmt)} because the outstanding ` +
        `balance on this asset is only ${formatCurrency(selectedLoan.remaining_amount)}.`
      )
      return
    }

    startTransition(async () => {
      // Step A: Insert the matching loan_return ledger record
      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          household_id:           householdId,                 //
          cycle_id:               currentCycleId,               //
          created_by:             createdBy,                    //
          transaction_type:       "loan_return",                //
          payment_account:        selectedLoan.payment_account, // landing target
          amount:                 inputAmt,                     // the captured transaction chunk
          counterparty_name:      selectedLoan.counterparty_name, //
          description:            `Collected: Repayment of ${formatCurrency(inputAmt)} from ${selectedLoan.counterparty_name ?? "Borrower"}`,
          notes:                  `Linked to parent asset loan ID: ${selectedLoan.id}`, //
          paid_by:                null,                         //
          category_id:            null,                         //
          related_transaction_id: selectedLoan.id,              //
        })

      if (insertError) {
        console.error("Collection write failure:", insertError.message)
        setLocalError(`Failed to insert collection row: ${insertError.message}`)
        return
      }

      // 🏆 Step B: State Machine Evaluation (Calculate next loan_status)
      // If the collected amount equals what was remaining, it's fully 'settled'. Otherwise, it transitions to 'partial'.
      const nextStatus: ReceivableRecord["loan_status"] = 
        inputAmt === selectedLoan.remaining_amount ? "settled" : "partial"

      const { error: updateError } = await supabase
        .from("transactions")
        .update({ loan_status: nextStatus })
        .eq("id", selectedLoan.id)                             //

      if (updateError) {
        console.error("loan_status structural update failure:", updateError.message)
        setLocalError(`Repayment saved but asset status progression failed: ${updateError.message}`)
        return
      }

      // Cleanup on full execution success
      setSelectedLoan(null)
      reset()
      router.refresh()                                         //
    })
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3"> {/* */}
        <div>
          <h3 className="text-base font-bold text-gray-900">Active Receivables Log</h3> {/* */}
          <p className="text-xs text-gray-500">Unsettled household assets currently outstanding.</p> {/* */}
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-100 font-bold text-xs px-2.5 py-1 rounded-full"> {/* */}
          {records.length} Pending Collection{records.length !== 1 ? "s" : ""} {/* */}
        </span>
      </div>

      {/* ── 🏆 MEDIATORY RHF INLINE COLLECTION INTERFACE ── */}
      {selectedLoan && (
        <div className="bg-slate-50 border-2 border-emerald-600 rounded-xl p-4 space-y-3">
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              Record Collection: {selectedLoan.counterparty_name || "Unknown Borrower"}
            </h4>
            <p className="text-[11px] text-slate-500">
              Outstanding Balance: <span className="font-bold text-slate-700">{formatCurrency(selectedLoan.remaining_amount)}</span> 
              {selectedLoan.loan_status === "partial" && ` (Original: ${formatCurrency(selectedLoan.amount)})`}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmitCollection)} className="flex flex-col gap-3">
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

      {/* Ledger Table View */}
      {records.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50 border border-dashed rounded-lg"> {/* */}
          Clear ledger — no outstanding receivables for this cycle. {/* */}
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
        const isPartial = tx.loan_status === "partial" //
        return (
          <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
            <td className="py-3 px-3 font-medium text-gray-500 whitespace-nowrap">
              {formatDate(tx.created_at)} {/* */}
            </td>
            <td className="py-3 px-3 font-bold text-gray-900">
              {tx.counterparty_name ?? "—"} {/* */}
            </td>
            <td className="py-3 px-3 text-gray-600 max-w-xs truncate" title={tx.description ?? ""}>
              {tx.description ?? "Lent funds"} {/* */}
            </td>
            <td className="py-3 px-3 whitespace-nowrap">
              <span className="px-2 py-0.5 border text-[10px] rounded font-bold uppercase bg-amber-50 text-amber-700 border-amber-100">
                {tx.payment_account} {/* */}
              </span>
            </td>
            <td className="py-3 px-3 whitespace-nowrap">
              <span className={`px-2 py-0.5 border text-[10px] rounded-md font-bold capitalize ${STATUS_STYLES[tx.loan_status]}`}>
                {tx.loan_status} {/* */}
              </span>
            </td>
            <td className="py-3 px-3 text-right whitespace-nowrap">
              <span className="font-black tracking-tight text-amber-600 block">
                {formatCurrency(tx.remaining_amount)} {/* */}
              </span>
              {isPartial && ( //
                <span className="text-[10px] text-gray-400">
                  of {formatCurrency(tx.amount)} {/* */}
                </span>
              )}
            </td>
            <td className="py-2 px-3 text-center whitespace-nowrap">
              <button
                onClick={() => { setSelectedLoan(tx); setLocalError(null); }} //
                disabled={isPending} //
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving…" : isPartial ? "Collect Rest" : "Collect"} {/* */}
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
  )
}