// app/dashboard/debts/_components/RepaymentHistoryTable.tsx
"use client"

import { useState } from "react"
import { Plus, Banknote, CreditCard } from "lucide-react"
import type { DebtInstallment, ParsedDebtItem } from "@/app/dashboard/_db/debt"
import RecordRepaymentModal from "./RecordRepaymentModal"

interface RepaymentHistoryTableProps {
  debt: ParsedDebtItem
  installments: DebtInstallment[]
  originalAmount: number
  totalPaid: number
  remainingAmount: number
}

export default function RepaymentHistoryTable({
  debt,
  installments,
  originalAmount,
  totalPaid,
  remainingAmount,
}: RepaymentHistoryTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const isSettled = remainingAmount <= 0.001

  return (
    <div className="px-4 sm:px-6 py-4 bg-[#fafbfc]/70 border-t border-gray-50 space-y-4">
      {/* Title */}
      <h4 className="text-xs font-bold text-[#2d3436]">Repayment History</h4>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50 text-[11px] font-semibold text-gray-400">
          <div className="col-span-4">Payment Date</div>
          <div className="col-span-3">Amount</div>
          <div className="col-span-3">Payment Vault</div>
          <div className="col-span-2 text-right">Notes</div>
        </div>

        {/* Rows */}
        {installments.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No repayments recorded yet.
          </div>
        ) : (
          installments.map((inst) => (
            <div
              key={inst.id}
              className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50/80 last:border-b-0 items-center text-xs text-[#2d3436]"
            >
              <div className="col-span-4 text-gray-500 font-medium">
                {new Date(inst.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="col-span-3 font-bold text-[#00b894]">
                Rs {inst.amount.toLocaleString()}
              </div>
              <div className="col-span-3 flex items-center gap-1.5 text-gray-500 capitalize">
                {inst.payment_account === "card" ? (
                  <CreditCard size={13} className="text-gray-400" />
                ) : (
                  <Banknote size={13} className="text-gray-400" />
                )}
                {inst.payment_account}
              </div>
              <div className="col-span-2 text-right text-gray-400 truncate">
                {inst.notes || "—"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Metrics + Action CTA Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px]">Original Amount</span>
            <span className="font-bold text-[#2d3436]">Rs {originalAmount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Total Paid</span>
            <span className="font-bold text-gray-700">Rs {totalPaid.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Remaining</span>
            <span className={`font-bold ${isSettled ? "text-[#00b894]" : "text-[#e17055]"}`}>
              Rs {remainingAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Record Repayment Button (hidden when already fully settled) */}
        {!isSettled && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d3436] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] shrink-0"
          >
            Record Repayment
            <Plus size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Modal Popup */}
      <RecordRepaymentModal
        debt={debt}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}