"use client"
// app/dashboard/components/Payables.tsx

import React, { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────

export interface PayableRecord {
  id: string
  amount: number
  remaining_amount: number                          // outstanding after prior partial payments
  transaction_type: "loan_in" | "expense"
  loan_status: "pending" | "partial" | "settled" | null   // for loan_in rows
  reimbursement_status: "pending" | "partial" | "settled" | null  // for expense rows
  household_id: string
  cycle_id: string
  counterparty_name: string | null
  description: string | null
  created_at: string
  related_transaction_id: string | null
}

interface ActivePayablesProps {
  records: PayableRecord[]
  totalPayablesAmount: number
  cashBalance: number
  cardBalance: number
  createdBy: string
}

interface SettleFormValues {
  payment_account: "cash" | "card" | "personal"
  settle_amount: number     // allows partial — defaults to remaining_amount
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

export default function ActivePayables({
  records = [],
  totalPayablesAmount,
  cashBalance,
  cardBalance,
  createdBy,
}: ActivePayablesProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [selectedLoan, setSelectedLoan] = useState<PayableRecord | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch } = useForm<SettleFormValues>({
    defaultValues: { payment_account: "cash", settle_amount: 0 },
  })

  const watchedAmount = watch("settle_amount")

  const openForm = (record: PayableRecord) => {
    reset({ payment_account: "cash", settle_amount: record.remaining_amount })
    setSelectedLoan(record)
    setLocalError(null)
  }

  const onSubmitSettlement = async (data: SettleFormValues) => {
    if (!selectedLoan) return
    setLocalError(null)

    const settleAmt = Number(data.settle_amount)

    // Validate: must be positive and not exceed remaining
    if (!settleAmt || settleAmt <= 0) {
      setLocalError("Please enter a valid payment amount.")
      return
    }
    if (settleAmt > selectedLoan.remaining_amount) {
      setLocalError(
        `Amount exceeds remaining balance of ${fmt(selectedLoan.remaining_amount)}.`
      )
      return
    }

    // Liquidity check against chosen wallet
    const walletBalance = data.payment_account === "cash" ? cashBalance : cardBalance
    if (walletBalance < settleAmt) {
      setLocalError(
        `Insufficient funds. ${data.payment_account.toUpperCase()} has ${fmt(walletBalance)}, ` +
        `but you're trying to pay ${fmt(settleAmt)}.`
      )
      return
    }

    // Determine if this payment fully clears the remaining balance
    const isFullSettlement = settleAmt >= selectedLoan.remaining_amount
    const isExpense = selectedLoan.transaction_type === "expense"

    startTransition(async () => {
      // Step A: Insert the repayment / settlement transaction row
      const { error: insertError } = await supabase
        .from("transactions")
        .insert({
          household_id:           selectedLoan.household_id,
          cycle_id:               selectedLoan.cycle_id,
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
        setLocalError(`Write failed: ${insertError.message}`)
        return
      }

      // Step B: Update the status on the original row
      // For expense → reimbursement_status; for loan_in → loan_status
      const statusField   = isExpense ? "reimbursement_status" : "loan_status"
      const statusValue   = isFullSettlement ? "settled" : "partial"

      const { error: updateError } = await supabase
        .from("transactions")
        .update({ [statusField]: statusValue })
        .eq("id", selectedLoan.id)

      if (updateError) {
        setLocalError(`Payment logged but status update failed: ${updateError.message}`)
        return
      }

      setSelectedLoan(null)
      reset()
      router.refresh()
    })
  }

  // ── Render ─────────────────────────────────────────────────

  return (
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

      {/* Settlement form (inline, shown when a row is selected) */}
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
            {/* Payment amount — editable so partial payments are possible */}
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
              {/* Inform user whether this will be a partial or full settlement */}
              {watchedAmount > 0 && watchedAmount < selectedLoan.remaining_amount && (
                <p style={{ margin: "3px 0 0 0", fontSize: 11, color: "#2563eb" }}>
                  This will mark the record as <strong>partial</strong>.
                </p>
              )}
            </div>

            {/* Source wallet */}
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
                  {/* Show original vs remaining when partially paid */}
                  {isPartial && (
                    <p style={{ margin: "3px 0 0 0", fontSize: 11, color: "#2563eb" }}>
                      {fmt(selectedLoan?.id === loan.id ? loan.remaining_amount : loan.remaining_amount)} remaining of {fmt(loan.amount)} original
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
  )
}