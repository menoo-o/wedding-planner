"use client"
"use no memo"

// app/dashboard/components/TransferModal.tsx
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"
import { ArrowRight, ArrowLeftRight, Wallet, CreditCard, PiggyBank, Lightbulb } from "lucide-react"
import ModalShell from "@/app/dashboard/components/ModalShell"
import {
  labelCls, errorCls, inputCls,
  formShellCls, formBodyCls, formFooterCls, submitBtnCls,
} from "@/app/dashboard/_lib/formStyles"

type AccountKey = "cash" | "card" | "vault"

type TransferFormData = {
  amount: number
  from_account: AccountKey
  to_account: AccountKey
  description: string
}

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  householdId: string | null
  currentCycleId: string | null
  cashBalance: number
  cardBalance: number
  walletName: string | null
  savingsBalance: number
}

function accountMeta(key: AccountKey, walletName: string | null) {
  switch (key) {
    case "cash":
      return { label: "Cash wallet", sub: "House Cash", Icon: Wallet, iconBg: "bg-[#00b894]/10", iconColor: "text-[#00b894]" }
    case "card":
      return { label: "Bank card", sub: "Primary card", Icon: CreditCard, iconBg: "bg-[#8b9dc3]/15", iconColor: "text-[#8b9dc3]" }
    case "vault":
      return { label: walletName || "Savings Wallet", sub: "Locked vault", Icon: PiggyBank, iconBg: "bg-[#2d3436]/10", iconColor: "text-[#2d3436]" }
  }
}

export default function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  householdId,
  currentCycleId,
  cashBalance,
  cardBalance,
  walletName,
  savingsBalance,
}: TransferModalProps) {
  const supabase = createClient()
  const [writeError, setWriteError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    mode: "onChange",
    defaultValues: {
      amount: undefined,
      from_account: "cash",
      to_account: "card",
      description: "",
    },
  })

  const fromAccount = watch("from_account")
  const toAccount = watch("to_account")
  const description = watch("description") || ""

  const options: AccountKey[] = walletName ? ["cash", "card", "vault"] : ["cash", "card"]

  const balanceOf = (key: AccountKey) =>
    key === "cash" ? cashBalance : key === "card" ? cardBalance : savingsBalance

  const availableCeiling = balanceOf(fromAccount)
  const activeWalletName = walletName || "Savings Wallet"
  const involvesVault = fromAccount === "vault" || toAccount === "vault"

  function pickFrom(key: AccountKey) {
    setValue("from_account", key)
    if (key === toAccount) {
      // Swap instead of leaving both sides pointing at the same account
      setValue("to_account", fromAccount)
    }
  }

  function pickTo(key: AccountKey) {
    setValue("to_account", key)
    if (key === fromAccount) {
      setValue("from_account", toAccount)
    }
  }

  if (!isOpen) return null

  async function onSubmit(data: TransferFormData) {
    setWriteError(null)

    if (!householdId || !currentCycleId) {
      setWriteError("Missing structural ledger references. Please reload.")
      return
    }
    if (data.from_account === data.to_account) {
      setWriteError("Choose two different accounts to transfer between.")
      return
    }

    const nowStr = new Date().toISOString()
    const customReason = data.description.trim() || "Internal vault fund allocation"
    let batchPayload: any[] = []

    if (involvesVault) {
      const vaultIsSource = data.from_account === "vault"
      const spendingLeg = (vaultIsSource ? data.to_account : data.from_account) as "cash" | "card"

      const { data: currentHousehold, error: fetchError } = await supabase
        .from("households")
        .select("savings_balance")
        .eq("id", householdId)
        .single()

      if (fetchError || !currentHousehold) {
        setWriteError("Could not verify household vault setup configuration.")
        return
      }

      const currentSavingsPool = Number(currentHousehold.savings_balance || 0)
      let targetSavingsBalance = currentSavingsPool

      if (vaultIsSource) {
        // Emergency Fund → Cash/Card
        if (currentSavingsPool < data.amount) {
          setWriteError(`Insufficient vault balance! Available: Rs. ${currentSavingsPool}`)
          return
        }
        targetSavingsBalance -= data.amount
        batchPayload = [
          {
            household_id: householdId,
            cycle_id: currentCycleId,
            transaction_type: "transfer",
            payment_account: spendingLeg,
            amount: data.amount,
            description: `Transfer in from ${activeWalletName.toUpperCase()}`,
            notes: customReason,
            created_at: nowStr,
            paid_by: "household",
            category_id: null,
          },
        ]
      } else {
        // Cash/Card → Emergency Fund
        targetSavingsBalance += data.amount
        batchPayload = [
          {
            household_id: householdId,
            cycle_id: currentCycleId,
            transaction_type: "transfer",
            payment_account: spendingLeg,
            amount: data.amount,
            description: `Transfer out to ${activeWalletName.toUpperCase()}`,
            notes: customReason,
            created_at: nowStr,
            paid_by: "household",
            category_id: null,
          },
        ]
      }

      const { error: householdUpdateError } = await supabase
        .from("households")
        .update({ savings_balance: targetSavingsBalance })
        .eq("id", householdId)

      if (householdUpdateError) {
        setWriteError(`Failed to process vault update: ${householdUpdateError.message}`)
        return
      }
    } else {
      // Cash ↔ Card
      batchPayload = [
        {
          household_id: householdId,
          cycle_id: currentCycleId,
          transaction_type: "transfer",
          payment_account: data.from_account,
          amount: data.amount,
          description: `Transfer out to ${data.to_account.toUpperCase()}`,
          notes: customReason,
          created_at: nowStr,
          paid_by: "household",
          category_id: null,
        },
        {
          household_id: householdId,
          cycle_id: currentCycleId,
          transaction_type: "transfer",
          payment_account: data.to_account,
          amount: data.amount,
          description: `Transfer in from ${data.from_account.toUpperCase()}`,
          notes: customReason,
          created_at: nowStr,
          paid_by: "household",
          category_id: null,
        },
      ]
    }

    const { error: txError } = await supabase.from("transactions").insert(batchPayload)
    if (txError) {
      setWriteError(txError.message)
      return
    }

    reset()
    onClose()
    onSuccess()
  }

  const fromMeta = accountMeta(fromAccount, walletName)
  const toMeta = accountMeta(toAccount, walletName)

  return (
    <ModalShell
      title="Move Vault Funds"
      subtitle="Shift liquidity balances internally across household layers."
      onClose={onClose}
      size="xl"
      icon={<ArrowLeftRight size={20} strokeWidth={1.8} className="text-[#8b9dc3]" />}
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <form onSubmit={handleSubmit(onSubmit)} className={`${formShellCls} lg:w-[58%]`}>
          <div className={`${formBodyCls} space-y-4`}>
            {writeError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-2xl border border-red-100 font-medium">
                {writeError}
              </div>
            )}

            {/* From / To — each side picks independently from every account,
                including the vault, so pulling vault → card no longer needs
                a round trip through "Internal Transfer". */}
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className={labelCls}>From</label>
                  <span className="text-[11px] font-medium text-gray-400">
                    Rs {balanceOf(fromAccount).toLocaleString()} available
                  </span>
                </div>
                <AccountPills options={options} active={fromAccount} onPick={pickFrom} walletName={walletName} />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const f = fromAccount
                    setValue("from_account", toAccount)
                    setValue("to_account", f)
                  }}
                  aria-label="Swap from and to"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors hover:border-[#8b9dc3] hover:text-[#8b9dc3]"
                >
                  <ArrowLeftRight size={13} strokeWidth={2} className="rotate-90" />
                </button>
              </div>

              <div>
                <label className={`${labelCls} mb-1.5 block`}>To</label>
                <AccountPills options={options} active={toAccount} onPick={pickTo} walletName={walletName} />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className={labelCls}>Amount</label>
                <span className="text-[11px] font-medium text-gray-400 text-right">
                  Available: Rs {availableCeiling.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-gray-400 pointer-events-none">
                  Rs
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount", {
                    required: "Please enter a valid transfer amount",
                    valueAsNumber: true,
                    validate: {
                      positive: (v) => v > 0 || "Amount must be greater than zero",
                      insufficient: (v) =>
                        v <= availableCeiling ||
                        `No funds! You only have Rs ${availableCeiling.toLocaleString()} available.`,
                    },
                  })}
                  className={`${inputCls(!!errors.amount, "pl-12 pr-4", "h-12")} !text-lg font-bold tabular-nums`}
                />
              </div>
              {errors.amount && <p className={errorCls}>{errors.amount.message}</p>}
            </div>

            {/* Flow strip: quick visual confirmation of the selected legs */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-transparent bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide">
              <span className="text-[#e17055] truncate">{fromMeta.label}</span>
              <ArrowRight size={14} className="mx-2 shrink-0 text-gray-300" />
              <span className="text-[#00b894] truncate">{toMeta.label}</span>
            </div>

            {/* Memo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className={labelCls}>Memo / reason (optional)</label>
                <span className="text-[11px] text-gray-300">{description.length}/100</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Savings allocation, emergency backup"
                maxLength={100}
                {...register("description")}
                className={inputCls(false, "px-4", "h-11")}
              />
            </div>
          </div>

          <div className={formFooterCls}>
            <button
              type="submit"
              disabled={isSubmitting || !!errors.amount || fromAccount === toAccount}
              className={`${submitBtnCls} justify-center`}
            >
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  Confirm Transfer
                  <ArrowRight size={16} strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right rail: informational, lg: and up only */}
        <div className="hidden lg:block lg:w-[42%] border-l border-gray-50 bg-gray-50/40 px-7 py-7 overflow-y-auto">
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${fromMeta.iconBg}`}>
              <fromMeta.Icon size={20} strokeWidth={1.6} className={fromMeta.iconColor} />
            </span>
            <ArrowRight size={16} className="text-gray-300 shrink-0" />
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toMeta.iconBg}`}>
              <toMeta.Icon size={20} strokeWidth={1.6} className={toMeta.iconColor} />
            </span>
          </div>

          <h3 className="mt-4 text-base font-bold text-[#2d3436]">
            {involvesVault ? "Vault Transfer" : "Internal Transfer"}
          </h3>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
            {involvesVault
              ? `Move funds between your spending accounts and ${activeWalletName}.`
              : "Move funds between your own accounts (cash, card)."}
          </p>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-[#2d3436]">
              <Lightbulb size={14} strokeWidth={1.8} />
              <span className="text-sm font-bold">Quick tips</span>
            </div>
            <ul className="mt-2.5 space-y-2 text-sm text-gray-400 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-gray-300">•</span>
                Transfers are instant and free.
              </li>
              <li className="flex gap-2">
                <span className="text-gray-300">•</span>
                Pick any two accounts as From and To — including {walletName ? activeWalletName : "your accounts"} directly.
              </li>
              <li className="flex gap-2">
                <span className="text-gray-300">•</span>
                Use a memo to keep track of the reason for the transfer.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

function AccountPills({
  options,
  active,
  onPick,
  walletName,
}: {
  options: AccountKey[]
  active: AccountKey
  onPick: (key: AccountKey) => void
  walletName: string | null
}) {
  return (
    <div className={`grid gap-1.5 ${options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((key) => {
        const meta = accountMeta(key, walletName)
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-2.5 text-center transition-all ${
              isActive
                ? "border-[#2d3436] bg-[#2d3436] text-white"
                : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
            }`}
          >
            <meta.Icon size={16} strokeWidth={1.8} className={isActive ? "text-white" : meta.iconColor} />
            <span className="text-[11px] font-semibold leading-tight truncate max-w-full">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}