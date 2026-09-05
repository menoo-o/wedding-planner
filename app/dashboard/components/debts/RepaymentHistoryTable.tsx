// app/dashboard/debts/_components/RepaymentHistoryTable.tsx
"use client"

import { Plus, MoreVertical, Banknote, CreditCard } from "lucide-react"
import type { DebtInstallment } from "@/app/dashboard/_db/debt"

interface RepaymentHistoryTableProps {
  installments: DebtInstallment[]
  originalAmount: number
  totalPaid: number
  remainingAmount: number
}

export default function RepaymentHistoryTable({
  installments,
  originalAmount,
  totalPaid,
  remainingAmount,
}: RepaymentHistoryTableProps) {
  return (
    <div className="bg-[#fcfdfd] border-t border-gray-100 p-6 space-y-4">
      <div className="text-xs font-semibold text-[#2d3436]">Repayment History</div>

      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-12 px-4 py-2.5 bg-[#f8f9fa] text-[11px] font-semibold text-gray-400 border-b border-gray-100">
          <div className="col-span-3">Payment Date</div>
          <div className="col-span-3">Amount</div>
          <div className="col-span-3">Payment Vault</div>
          <div className="col-span-3">Notes</div>
        </div>

        {installments.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">
            No repayments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="grid grid-cols-12 px-4 py-3 text-xs items-center text-[#2d3436]"
              >
                <div className="col-span-3 text-gray-500 font-medium">
                  {new Date(inst.created_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>

                <div className="col-span-3 font-semibold">
                  Rs {inst.amount.toLocaleString()}
                </div>

                <div className="col-span-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
                    {inst.payment_account === "cash" ? (
                      <Banknote size={13} className="text-emerald-600" />
                    ) : (
                      <CreditCard size={13} className="text-blue-600" />
                    )}
                    <span className="capitalize">{inst.payment_account}</span>
                  </span>
                </div>

                <div className="col-span-3 flex items-center justify-between text-gray-400">
                  <span className="truncate pr-2">{inst.notes || "—"}</span>
                  <button
                    type="button"
                    className="p-1 hover:text-gray-600 rounded"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="flex items-center gap-8 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Original Amount</span>
            <span className="font-semibold text-[#2d3436]">
              Rs {originalAmount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Total Paid</span>
            <span className="font-semibold text-[#2d3436]">
              Rs {totalPaid.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Remaining</span>
            <span className="font-bold text-[#e17055]">
              Rs {remainingAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d3436] text-white text-xs font-semibold hover:bg-black transition-colors self-start sm:self-auto shadow-sm"
        >
          Record Repayment
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}