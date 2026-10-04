// app/dashboard/savings/emergency-spend/_components/EmergencySpendHeader.tsx
export default function EmergencySpendHeader() {
  return (
    <header className="flex min-h-[3rem] items-center justify-between">
      <div className="max-w-[58%] lg:max-w-none">
        <h1 className="text-xl font-semibold tracking-tight text-[#2d3436] sm:text-2xl">
          Emergency Spend
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-500 sm:text-sm">
          Track and manage unexpected household expenses.
        </p>
      </div>
    </header>
  )
}