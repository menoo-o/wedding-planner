// app/dashboard/components/liquidity-widget/LiquidityDisplay.tsx
"use client"

interface LiquidityDisplayProps {
  cash: number
  card: number
  total: number
}

export default function LiquidityDisplay({ cash, card, total }: LiquidityDisplayProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {/* Total Pool */}
      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
        <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Total Liquidity</p>
        <h3 className="text-xl font-black mt-0.5 text-gray-900 tracking-tight">{formatCurrency(total)}</h3>
      </div>

      {/* Cash Pool */}
      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-inner-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Cash Wallet</p>
        </div>
        <h3 className="text-xl font-bold mt-0.5 text-gray-900 tracking-tight">{formatCurrency(cash)}</h3>
      </div>

      {/* Card Pool */}
      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-inner-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Bank Card</p>
        </div>
        <h3 className="text-xl font-bold mt-0.5 text-gray-900 tracking-tight">{formatCurrency(card)}</h3>
      </div>
    </div>
  )
}