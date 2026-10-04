// app/dashboard/savings/emergency-spend/_components/EmergencyStatsRow.tsx
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, CreditCard, TrendingUp, Wallet } from "lucide-react"

const eyebrow =
  "text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-gray-500"
const valueCls =
  "text-xl font-semibold leading-9 tracking-tight tabular-nums sm:text-[28px]"
const caption = "mt-2 text-xs text-gray-500 sm:mt-3"

interface StatsProps {
  stats: {
    availableEmergencyBalance: number
    spentInYear: number
    yearOverYearDelta: number
    paidExpensesCount: number
    plannedCount: number
    largestExpenseAmount: number
    largestExpenseTitle: string | null
  }
  selectedYear: number
}

function KpiCard({
  label,
  Icon,
  iconTone,
  barTone,
  children,
}: {
  label: string
  Icon: LucideIcon
  iconTone: string
  barTone: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm sm:p-6">
      {/* Header: title left, icon badge right */}
      <div className="flex min-h-8 items-center justify-between gap-2 sm:min-h-10">
        <span className={eyebrow}>{label}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${iconTone}`}
        >
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-3 sm:mt-4">{children}</div>

      <div className={`mt-4 h-1 rounded-full sm:mt-5 ${barTone}`} />
    </div>
  )
}

export default function EmergencyStatsRow({ stats, selectedYear }: StatsProps) {
  const delta = Number(stats.yearOverYearDelta) || 0
  const deltaTone =
    delta === 0 ? "text-gray-500" : delta < 0 ? "text-[#008060]" : "text-[#c2492f]"
  const deltaArrow = delta === 0 ? "" : delta < 0 ? "▼ " : "▲ "

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* ── 1. Emergency Fund ── */}
      <KpiCard
        label="Emergency Fund"
        Icon={Wallet}
        iconTone="bg-emerald-50 text-emerald-600"
        barTone="bg-emerald-500"
      >
        <p className={`${valueCls} text-[#2d3436]`}>
          Rs {stats.availableEmergencyBalance.toLocaleString()}
        </p>
        <p className={caption}>Available balance</p>
      </KpiCard>

      {/* ── 2. Spent in Year ── */}
      <KpiCard
        label={`Spent in ${selectedYear}`}
        Icon={TrendingUp}
        iconTone="bg-blue-50 text-blue-600"
        barTone="bg-blue-500"
      >
        <p className={`${valueCls} text-[#2d3436]`}>
          Rs {stats.spentInYear.toLocaleString()}
        </p>
        <p className={`${caption} font-medium ${deltaTone}`}>
          {deltaArrow}
          {Math.abs(delta)}% vs last year
        </p>
      </KpiCard>

      {/* ── 3. Entries (Settled vs Planned) ── */}
      <KpiCard
        label="Entries"
        Icon={CreditCard}
        iconTone="bg-purple-50 text-purple-600"
        barTone="bg-purple-200"
      >
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div>
            <p className={`${valueCls} text-[#2d3436]`}>{stats.paidExpensesCount}</p>
            <p className={caption}>Settled</p>
          </div>
          <div className="pl-3 sm:pl-5">
            <p className={`${valueCls} text-amber-600`}>{stats.plannedCount}</p>
            <p className={`${caption} text-amber-700`}>Planned</p>
          </div>
        </div>
      </KpiCard>

      {/* ── 4. Largest Expense ── */}
      <KpiCard
        label="Largest Expense"
        Icon={AlertTriangle}
        iconTone="bg-red-50 text-[#c2492f]"
        barTone="bg-[#e17055]"
      >
        <p className={`${valueCls} text-[#c2492f]`}>
          -Rs {stats.largestExpenseAmount.toLocaleString()}
        </p>
        <p className={`${caption} truncate`}>
          {stats.largestExpenseTitle || "No expenses yet"}
        </p>
      </KpiCard>
    </div>
  )
}