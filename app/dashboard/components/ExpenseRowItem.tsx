// app/dashboard/expenses/_components/ExpenseRowItem.tsx
"use client"

import { useState } from "react"
import {
  ChevronDown,
  Pencil,
  Trash2,
  Lock,
  Loader2,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
} from "lucide-react"
import type { ExpenseTransaction } from "../_lib/utils" //[cite: 16]
import { softDeleteExpenseAction } from "@/app/dashboard/expenses/actions"
import EditExpenseModal from "@/app/dashboard/components/EditExpenseModal"

interface RowProps {
  tx: ExpenseTransaction //[cite: 16]
  isLast: boolean
  isCycleOpen: boolean
  categories: { id: string; name: string }[] //[cite: 16]
  categoryIcon: React.ReactNode
  categoryColor: string
}

export default function ExpenseRowItem({
  tx,
  isLast,
  isCycleOpen,
  categories,
  categoryIcon,
  categoryColor,
}: RowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete "${tx.description || tx.category_name}"?`)) { //[cite: 16]
      return
    }

    setIsDeleting(true)
    setErrorMsg(null)
    try {
      await softDeleteExpenseAction(tx.id) //[cite: 16]
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete expense")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className={`transition-colors ${!isLast ? "border-b border-gray-50" : ""} ${
          isExpanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"
        }`}
      >
        {/* ── Main Collapsed Row (Clickable) ── */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center justify-between px-5 py-4 cursor-pointer select-none group"
        >
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: `color-mix(in srgb, ${categoryColor} 15%, transparent)`,
                color: categoryColor,
              }}
            >
              {categoryIcon}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2d3436] truncate">
                {tx.description || tx.category_name} {/*[cite: 16] */}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="text-xs text-gray-400 capitalize lg:uppercase tracking-wider truncate">
                  {tx.category_name} {/*[cite: 16] */}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400 capitalize">
                  {tx.payment_account} {/*[cite: 16] */}
                </span>
                {tx.reimbursement_status === "pending" && ( //[cite: 16]
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                      Pending
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Amount & Expand Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-[#2d3436] tabular-nums">
              -Rs {tx.amount.toLocaleString()} {/*[cite: 16] */}
            </span>
            <div
              className={`text-gray-300 group-hover:text-gray-500 transition-transform duration-200 ${
                isExpanded ? "rotate-180 text-gray-600" : ""
              }`}
            >
              <ChevronDown size={16} strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* ── Expanded Drawer Tray ── */}
        {isExpanded && (
          <div className="px-5 pb-4 pt-1 border-t border-gray-100/70 bg-white/70 animate-in fade-in slide-in-from-top-1 duration-150">
            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              {/* Detailed Metadata Pill Badges */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 font-medium">
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                  <Calendar size={12} className="text-gray-400" />
                  {new Date(tx.created_at).toLocaleDateString("en-US", { //[cite: 16]
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg capitalize">
                  <CreditCard size={12} className="text-gray-400" />
                  {tx.payment_account} account {/*[cite: 16] */}
                </span>

                {tx.counterparty_name && ( //[cite: 16]
                  <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                    <User size={12} className="text-gray-400" />
                    Payee: {tx.counterparty_name} {/*[cite: 16] */}
                  </span>
                )}
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {isCycleOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/90 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 shadow-2xs transition-all active:scale-95"
                    >
                      <Pencil size={12} className="text-gray-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/80 text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-50 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-100/90 px-3 py-1.5 rounded-xl">
                    <Lock size={12} />
                    <span>Cycle closed (Locked)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {isEditModalOpen && (
        <EditExpenseModal
          isOpen={isEditModalOpen}
          tx={tx}
          categories={categories}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  )
}