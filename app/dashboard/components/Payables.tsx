"use client"
// app/dashboard/components/Payables.tsx

import React, { useTransition, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Toast, { useToast } from "./Toast"

// ── Types ─────────────────────────────────────────────────────

import { PayableRecord } from "@/lib/types"

interface ActivePayablesProps {
  records: PayableRecord[]
  totalPayablesAmount: number
  cashBalance: number
  cardBalance: number
  createdBy: string
  currentCycleId: string    // ← NEW: required for Cycle B inserts
}

interface SettleFormValues {
  payment_account: "cash" | "card" | "personal"
  settle_amount: number
}

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", minimumFractionDigits: 0,
  }).format(n)
}

function StatusBadge({ record }: { record: PayableRecord }) {
  const status = record.transaction_type === "expense"
    ? record.reimbursement_status
    : record.loan_status

  const styles: Record<string, string> = {
    pending: "background:#fef3c7;color:#d97706;border:1px solid #fde68a",
    partial: "background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe",
    settled: "background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0",
  }

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"
  const style = styles[status ?? "pending"]

  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4, ...Object.fromEntries(style.split(";").map(s => s.split(":"))) }}>
      {label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────

// ── Component ─────────────────────────────────────────────────

export default function ActivePayables({
  records = [],
  totalPayablesAmount,
  cashBalance,
  cardBalance,
  createdBy,
  currentCycleId,    // ← NEW
}: ActivePayablesProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [selectedLoan, setSelectedLoan] = useState<PayableRecord | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const { toast, show, dismiss } = useToast()

  const { register, handleSubmit, reset, watch, setValue } = useForm<SettleFormValues>({
    defaultValues: { payment_account: "cash", settle_amount: 0 },
  })

  const watchedAmount = watch("settle_amount")
  const watchedAccount = watch("payment_account")

  const openForm = useCallback((record: PayableRecord) => {
    reset({ payment_account: "cash", settle_amount: record.remaining_amount })
    setSelectedLoan(record)
    setLocalError(null)
  }, [reset])

  const onSubmitSettlement = async (data: SettleFormValues) => {
    if (!selectedLoan) return
    setLocalError(null)

    const settleAmt = Number(data.settle_amount)

    // Validate
    if (!settleAmt || settleAmt <= 0) {
      setLocalError("Please enter a valid payment amount.")
      return
    }
    if (settleAmt > selectedLoan.remaining_amount) {
      setLocalError(`Amount exceeds remaining balance of ${fmt(selectedLoan.remaining_amount)}.`)
      return
    }

    // Liquidity guard
    const walletBalance = data.payment_account === "cash" ? cashBalance : cardBalance
    if (walletBalance < settleAmt) {
      show(
        "error",
        "Insufficient Funds",
        `Your ${data.payment_account.toUpperCase()} wallet only has ${fmt(walletBalance)}, but you're trying to pay ${fmt(settleAmt)}.`
      )
      return
    }

    const isFullSettlement = settleAmt >= selectedLoan.remaining_amount
    const isExpense = selectedLoan.transaction_type === "expense"

    startTransition(async () => {
      // Step A: Insert repayment row — Cycle B (current cycle)
      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          household_id:           selectedLoan.household_id,
          cycle_id:               currentCycleId,   // ← CHANGED: was selectedLoan.cycle_id, now Cycle B
          created_by:             createdBy,
          transaction_type:       isExpense ? "settlement" : "loan_return",
          payment_account:        data.payment_account,
          amount:                 settleAmt,
          counterparty_name:      selectedLoan.counterparty_name,
          description:            isExpense
            ? `Reimbursement${isFullSettlement ? "" : " (partial)"}: ${selectedLoan.counterparty_name ?? "Lender"}`
            : `Loan repayment${isFullSettlement ? "" : " (partial)"}: ${selectedLoan.counterparty_name ?? "Lender"}`,
          notes:                  `Linked to original transaction ID: ${selectedLoan.id}`,
          related_transaction_id: selectedLoan.id,
        })

      if (insertError) {
        show("error", "Payment Failed", `Could not record payment: ${insertError.message}`)
        return
      }

      // Step B: Update parent status
      const statusField = isExpense ? "reimbursement_status" : "loan_status"
      const statusValue = isFullSettlement ? "settled" : "partial"

      const { error: updateError } = await supabase
        .from("transactions")
        .update({ [statusField]: statusValue })
        .eq("id", selectedLoan.id)

      if (updateError) {
        show("error", "Status Update Failed", `Payment recorded but status not updated: ${updateError.message}`)
        return
      }

      // Success toast
      const party = selectedLoan.counterparty_name ?? "Unknown Party"
      const typeLabel = isExpense ? "bill" : "loan"
      show(
        "success",
        isFullSettlement ? `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Settled!` : "Partial Payment Recorded",
        isFullSettlement
          ? `Paid ${fmt(settleAmt)} to ${party} from ${data.payment_account.toUpperCase()}. ${typeLabel} fully cleared.`
          : `Paid ${fmt(settleAmt)} to ${party} from ${data.payment_account.toUpperCase()}. Remaining: ${fmt(selectedLoan.remaining_amount - settleAmt)}.`
      )

      setSelectedLoan(null)
      reset()
      router.refresh()
    })
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <Toast toast={toast} onDismiss={dismiss} />

      <div style={{
        background: "#fff", border: "1px solid #e4e4e7",
        borderRadius: 12, padding: 24, fontFamily: "system-ui, sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #f4f4f5", paddingBottom: 16, marginBottom: 16,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "#18181b", fontWeight: 600 }}>
              Active Payables
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#71717a" }}>
              Total Outstanding:{" "}
              <strong style={{ color: "#dc2626" }}>{fmt(totalPayablesAmount)}</strong>
            </p>
          </div>
        </div>

        {/* Settlement form */}
        {selectedLoan && (
          <div style={{
            background: "#fcfcfd", border: "1px solid #2563eb",
            borderRadius: 8, padding: 16, marginBottom: 16,
          }}>
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e3a8a" }}>
                {selectedLoan.transaction_type === "expense" ? "Reimburse Bill" : "Repay Loan"}{" — "}
                {selectedLoan.counterparty_name ?? "Unknown Party"}
              </p>
              <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#6b7280" }}>
                Original: {fmt(selectedLoan.amount)}
                {selectedLoan.remaining_amount < selectedLoan.amount && (
                  <> &nbsp;·&nbsp; Already paid: {fmt(selectedLoan.amount - selectedLoan.remaining_amount)}</>
                )}
                &nbsp;·&nbsp; <strong style={{ color: "#dc2626" }}>Remaining: {fmt(selectedLoan.remaining_amount)}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitSettlement)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 3 }}>
                  Payment Amount (max {fmt(selectedLoan.remaining_amount)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={selectedLoan.remaining_amount}
                  {...register("settle_amount", { valueAsNumber: true })}
                  style={{
                    padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db",
                    width: "100%", maxWidth: 200, fontSize: 14, fontWeight: 600,
                  }}
                />
                {watchedAmount > 0 && watchedAmount < selectedLoan.remaining_amount && (
                  <p style={{ margin: "3px 0 0 0", fontSize: 11, color: "#2563eb" }}>
                    This will mark the record as <strong>partial</strong>.
                  </p>
                )}
              </div>

              {/* Source wallet with live balance */}
              <div>
                <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 3 }}>
                  Pay from
                </label>
                <select
                  {...register("payment_account")}
                  style={{
                    padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db",
                    width: "100%", maxWidth: 200,
                  }}
                >
                  <option value="cash">Cash — {fmt(cashBalance)}</option>
                  <option value="card">Card — {fmt(cardBalance)}</option>
                </select>
                {watchedAmount > 0 && (
                  <p style={{
                    margin: "3px 0 0 0", fontSize: 11,
                    color: (watchedAccount === "cash" ? cashBalance : cardBalance) < watchedAmount ? "#dc2626" : "#16a34a",
                    fontWeight: 500,
                  }}>
                    {(watchedAccount === "cash" ? cashBalance : cardBalance) < watchedAmount
                      ? `⚠️ Insufficient ${watchedAccount} funds`
                      : `✓ ${watchedAccount} has enough funds`
                    }
                  </p>
                )}
              </div>

              {localError && (
                <p style={{ margin: 0, fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
                  {localError}
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    background: isPending ? "#e4e4e7" : "#2563eb",
                    color: isPending ? "#71717a" : "#fff",
                    border: "none", padding: "6px 16px", borderRadius: 4,
                    fontSize: 13, cursor: isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {isPending ? "Processing…" : "Confirm Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedLoan(null); setLocalError(null) }}
                  style={{
                    background: "transparent", color: "#4b5563",
                    border: "1px solid #d1d5db", padding: "6px 12px",
                    borderRadius: 4, fontSize: 13, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ledger rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {records.length === 0 ? (
            <p style={{ textAlign: "center", color: "#a1a1aa", fontSize: 14, padding: "16px 0" }}>
              🎉 Your household currently holds zero debt.
            </p>
          ) : (
            records.map((loan) => {
              const isPartial =
                loan.transaction_type === "expense"
                  ? loan.reimbursement_status === "partial"
                  : loan.loan_status === "partial"

              return (
                <div key={loan.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: 12, background: "#fafafa",
                  borderRadius: 8, border: "1px solid #f4f4f5",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#18181b" }}>
                        Owed to: {loan.counterparty_name ?? "Unknown Party"}
                      </p>
                      <StatusBadge record={loan} />
                      <span style={{
                        fontSize: 10, background: loan.transaction_type === "expense" ? "#fef3c7" : "#f1f5f9",
                        color: loan.transaction_type === "expense" ? "#d97706" : "#475569",
                        padding: "1px 6px", borderRadius: 4, fontWeight: 500,
                      }}>
                        {loan.transaction_type === "expense" ? "Bill" : "Loan"}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#71717a" }}>
                      {loan.description ?? "Borrowed funds"} &bull;{" "}
                      {new Date(loan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {isPartial && (
                      <p style={{ margin: "3px 0 0 0", fontSize: 11, color: "#2563eb" }}>
                        {fmt(loan.remaining_amount)} remaining of {fmt(loan.amount)} original
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#18181b", display: "block" }}>
                        {fmt(loan.remaining_amount)}
                      </span>
                      {isPartial && (
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>of {fmt(loan.amount)}</span>
                      )}
                    </div>
                    <button
                      disabled={isPending}
                      onClick={() => openForm(loan)}
                      style={{
                        background: isPending ? "#e4e4e7" : "#18181b",
                        color: isPending ? "#71717a" : "#fff",
                        border: "none", padding: "6px 12px", borderRadius: 6,
                        fontSize: 12, fontWeight: 500,
                        cursor: isPending ? "not-allowed" : "pointer",
                      }}
                    >
                      {isPartial ? "Pay More" : "Settle"}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}