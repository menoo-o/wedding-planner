// app/dashboard/components/ReceivablesList.tsx
"use client"

import { useTransition } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

interface ReceivableRecord {
  id: string
  amount: number
  transaction_type: string
  payment_account: "cash" | "card"
  counterparty_name: string
  description: string
  created_at: string
  notes: string | null
}

interface ReceivablesListProps {
  records: ReceivableRecord[]
  householdId: string
  currentCycleId: string
  createdBy: string
}

export default function ReceivablesList({ records, householdId, currentCycleId, createdBy }: ReceivablesListProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(val)
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  // 🏆 THE ONE-CLICK SETTLEMENT OPERATION (Direct Client Write)
  const handleSettleLoan = async (originalLoan: ReceivableRecord) => {
    const confirmSettlement = window.confirm(
      `Are you sure you want to mark the Rs. ${originalLoan.amount} loan from ${originalLoan.counterparty_name} as fully settled?`
    )
    if (!confirmSettlement) return

    startTransition(async () => {
      // const nowStr = new Date().toISOString()

      // Insert the matching repayment row directly to Supabase
      const { error } = await supabase
        .from("transactions")
        .insert({
          household_id: householdId,
          cycle_id: currentCycleId,
          created_by: createdBy,
          transaction_type: "loan_return", // Standard inflow type
          payment_account: originalLoan.payment_account, // Drops money back into the original wallet source
          amount: originalLoan.amount, // Full one-shot settlement amount
          counterparty_name: originalLoan.counterparty_name,
          description: `Settlement: Collected full loan back from ${originalLoan.counterparty_name}`,
          notes: `Linked to original loan ID: ${originalLoan.id}`,
          paid_by: "household",
          category_id: null,
          related_transaction_id: originalLoan.id // 🔗 CRITICAL LINK KEY ASSIGNMENT
        })

      if (error) {
        console.error("Settlement engine write failure:", error.message)
        alert(`Failed to settle loan: ${error.message}`)
        return
      }

      // Smoothly re-run all dashboard layout queries
      router.refresh()
    })
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Active Receivables Log</h3>
          <p className="text-xs text-gray-500">Unsettled household assets currently outstanding.</p>
        </div>
        
        <span className="bg-amber-50 text-amber-700 border border-amber-100 font-bold text-xs px-2.5 py-1 rounded-full">
          {records.length} Pending Collections
        </span>
      </div>

      {records.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50 border border-dashed rounded-lg">
          Clear ledger! There are no outstanding receivables for this cycle.
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
                <th className="py-2.5 px-3 text-right">Outstanding Amount</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {records.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-500 whitespace-nowrap">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="py-3 px-3 font-bold text-gray-900">
                    {tx.counterparty_name}
                  </td>
                  <td className="py-3 px-3 text-gray-600 max-w-xs truncate" title={tx.description}>
                    <span className="font-medium text-gray-800">{tx.description}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 border text-[10px] rounded font-bold uppercase bg-amber-50 text-amber-700 border-amber-100">
                      {tx.payment_account}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black tracking-tight text-amber-600 whitespace-nowrap">
                    {formatCurrency(tx.amount)}
                  </td>
                  {/* Settlement Trigger Button */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleSettleLoan(tx)}
                      disabled={isPending}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isPending ? "Settling..." : "Settle"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}