// app/dashboard/components/AdvancedMetrics.tsx
"use client"

interface AdvancedMetricsProps {
  receivables: number
  payables: number
  netDebt: number
  currentExpenses: number
  previousExpenses: number
  runway: number
  debtLoadRatio: number
}

export default function AdvancedMetrics({
  receivables,
  payables,
  netDebt,
  currentExpenses,
  previousExpenses,
  runway,
  debtLoadRatio
}: AdvancedMetricsProps) {
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(val)
  }

  // Compute burn delta percentage changes
  const expenseDelta = previousExpenses > 0 
    ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 
    : 0

  // Determine dynamic structural alert badge color arrays based on leverage rules
  const getDebtBadgeStyle = (ratio: number) => {
    if (ratio === 0 && payables === 0) return "bg-gray-100 text-gray-700 border-gray-200"
    if (ratio < 20) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (ratio <= 50) return "bg-amber-50 text-amber-700 border-amber-200"
    return "bg-red-50 text-red-700 border-red-200"
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* SECTION 1: DEBT & RISK CONTROL PROFILE */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Credit & Debt Positioning</h3>
          <p className="text-xs text-gray-500">Overview of external lending and leverage risk metrics.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Receivables (Owed to You)</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(receivables)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payables (You Owe Out)</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(payables)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dashed pt-3 text-xs">
          <span className="font-medium text-gray-600">Net Debt Exposure Position:</span>
          <span className={`font-bold text-sm ${netDebt >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {netDebt > 0 ? " +" : ""} {formatCurrency(netDebt)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
          <span className="font-medium text-gray-600">Debt Load Leverage Ratio:</span>
          <span className={`px-2 py-0.5 border rounded-md font-bold text-[11px] ${getDebtBadgeStyle(debtLoadRatio)}`}>
            {debtLoadRatio.toFixed(1)}% {debtLoadRatio > 50 ? "⚠️ Danger Leverage" : debtLoadRatio > 20 ? "Warning" : "Safe"}
          </span>
        </div>
      </div>

      {/* SECTION 2: RUNRATE SPEED & RUNWAY VELOCITY */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Capital Velocity & Runway</h3>
          <p className="text-xs text-gray-500">Tracking current monthly consumption rates against assets.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Month Expenses</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(currentExpenses)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Prior Month Burn Rate</p>
            <p className="text-base font-bold text-gray-500 mt-0.5">{formatCurrency(previousExpenses)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dashed pt-3 text-xs">
          <span className="font-medium text-gray-600">Cycle-over-Cycle Velocity:</span>
          <span className={`font-bold ${expenseDelta > 0 ? "text-red-500" : expenseDelta < 0 ? "text-emerald-500" : "text-gray-500"}`}>
            {expenseDelta > 0 ? "▲ Up " : expenseDelta < 0 ? "▼ Down " : ""}
            {expenseDelta === 0 ? "No Change" : `${Math.abs(expenseDelta).toFixed(1)}%`}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
          <span className="font-medium text-gray-600">Estimated Cash Survival Runway:</span>
          <span className="font-black text-sm text-gray-900">
            {runway === Infinity ? (
              <span className="text-emerald-600 font-bold">Infinite Runway (No Burn)</span>
            ) : (
              `${runway.toFixed(1)} Months Available`
            )}
          </span>
        </div>
      </div>

    </div>
  )
}