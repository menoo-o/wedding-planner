// app/dashboard/debts/_components/DebtsStatsRow.tsx

import { ArrowUpRight, Users, CheckCircle2, HelpCircle } from "lucide-react"

interface DebtsStatsProps {
  stats: {
    netDebtPosition: number
    totalReceivables: number
    totalPayables: number
    clearedThisMonth: number
    receivablesPeopleCount: number
    payablesPeopleCount: number
  }
}

export default function DebtsStatsRow({ stats }: DebtsStatsProps) {
  const isAhead = stats.netDebtPosition >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Net Debt Position */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2.5">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              Net Debt Position
              <HelpCircle size={13} className="text-gray-300 stroke-[2]" />
            </span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isAhead ? "bg-emerald-50 text-[#00b894]" : "bg-rose-50 text-[#e17055]"
              }`}
            >
              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className={!isAhead ? "rotate-90 text-[#e17055]" : ""}
              />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2d3436] tracking-tight">
            Rs {Math.abs(stats.netDebtPosition).toLocaleString()}
          </p>
        </div>
        <p
          className={`text-xs font-medium mt-3 ${
            isAhead ? "text-[#00b894]" : "text-[#e17055]"
          }`}
        >
          {isAhead ? "You're ahead" : "You're in net debt"}
        </p>
      </div>

      {/* 2. Total Owed to You */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2.5">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              Total Owed to You
              <HelpCircle size={13} className="text-gray-300 stroke-[2]" />
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00b894] flex items-center justify-center">
              <Users size={16} strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2d3436] tracking-tight">
            Rs {stats.totalReceivables.toLocaleString()}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-3 font-normal">
          Across {stats.receivablesPeopleCount} {stats.receivablesPeopleCount === 1 ? "person" : "people"}
        </p>
      </div>

      {/* 3. Total You Owe */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2.5">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              Total You Owe
              <HelpCircle size={13} className="text-gray-300 stroke-[2]" />
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-[#e17055] flex items-center justify-center">
              <Users size={16} strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#e17055] tracking-tight">
            Rs {stats.totalPayables.toLocaleString()}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-3 font-normal">
          Across {stats.payablesPeopleCount} {stats.payablesPeopleCount === 1 ? "person" : "people"}
        </p>
      </div>

      {/* 4. Cleared This Month */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-400 mb-2.5">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              Cleared This Month
              <HelpCircle size={13} className="text-gray-300 stroke-[2]" />
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-100">
              <CheckCircle2 size={16} strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2d3436] tracking-tight">
            Rs {stats.clearedThisMonth.toLocaleString()}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-3 font-normal">In repayments</p>
      </div>
    </div>
  )
}