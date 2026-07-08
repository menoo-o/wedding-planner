//app/dashboard/components/SavingsVaultWidget.tsx

"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { initializeSavingsWallet } from "../_services/savings"

interface SavingsVaultWidgetProps {
  householdId: string
  walletName: string | null
  savingsBalance: number
}

interface VaultFormValues {
  customName: string
}

export default function SavingsVaultWidget({
  householdId,
  walletName,
  savingsBalance,
}: SavingsVaultWidgetProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VaultFormValues>({
    defaultValues: { customName: "" },
  })

  const onSubmit = async (data: VaultFormValues) => {
    try {
      await initializeSavingsWallet(householdId, data.customName.trim())
      reset()
      router.refresh()
    } catch (err: any) {
      setError("root", {
        type: "manual",
        message: err.message || "Failed to initialize vault.",
      })
    }
  }

  // 1. Setup Render: User hasn't created a savings wallet yet
  if (!walletName) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h3 className="text-sm font-bold text-gray-900">Initialize Savings Lockbox</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Isolate specific funds from your daily spending metrics. Once created, money must be explicitly transferred out to spend it.
          </p>
        </div>

        {errors.root && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
            ⚠️ {errors.root.message}
          </p>
        )}
        {errors.customName && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
            ⚠️ {errors.customName.message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g., Haj Savings, Emergency Fund"
            className="flex-1 border border-gray-200 p-2 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-gray-900"
            {...register("customName", {
              required: "Please enter a name for the vault.",
              maxLength: { value: 30, message: "Name must be 30 characters or fewer." },
              validate: (value) => value.trim().length > 0 || "Please enter a name for the vault.",
            })}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shrink-0"
          >
            {isSubmitting ? "Creating..." : "Activate"}
          </button>
        </form>
      </div>
    )
  }

  // 2. Active Render: Displaying the Locked Vault
  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-950 rounded-xl p-5 shadow-md text-white space-y-3 relative overflow-hidden">
      {/* Decorative vector flair */}
      <div className="absolute right-[-10px] bottom-[-10px] text-7xl opacity-10 select-none pointer-events-none">
        💼
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
            Insulated Vault Active
          </span>
          <h3 className="text-sm font-bold tracking-tight text-slate-100">{walletName}</h3>
        </div>
        <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
          Limit: 1 Lockbox
        </span>
      </div>

      <div className="pt-1">
        <span className="text-[11px] text-slate-400 font-medium block">Vault Balance</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black font-mono tracking-tight text-white">
            Rs. {savingsBalance.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 leading-relaxed">
        🔒 <strong>Firewall Rule:</strong> Funds here are hidden from daily market expense selectors. Use the <strong>Transfer Modal</strong> to bring capital back to Cash or Card to spend it.
      </div>
    </div>
  )
}