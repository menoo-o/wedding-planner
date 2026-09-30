// app/dashboard/debts/_components/DebtsSkeleton.tsx

export default function DebtsSkeleton() {
  return (
    <div className="space-y-3.5 sm:space-y-5 pb-20 sm:pb-6 animate-pulse">
      {/* ── 1. Static Page Header ── */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2d3436] tracking-tight">
            Debt Tracker
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-tight">
            Track Your Dues
          </p>
        </div>

        {/* Action Button Skeleton */}
        <div className="h-9 w-32 bg-gray-200/80 rounded-xl hidden sm:block" />
      </div>

      {/* ── 2. KPI Cards (Static Labels + Pulsing Numbers) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Net Position */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Net Position
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50/60" />
            </div>
            <div className="h-7 w-24 bg-gray-200/80 rounded-md my-1" />
          </div>
          <div className="h-3.5 w-28 bg-gray-100 rounded mt-2.5" />
        </div>

        {/* Card 2: Owed to You */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Owed to You
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50/60" />
            </div>
            <div className="h-7 w-20 bg-gray-200/80 rounded-md my-1" />
          </div>
          <div className="h-3.5 w-20 bg-gray-100 rounded mt-2.5" />
        </div>

        {/* Card 3: You Owe */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                You Owe
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-50/60" />
            </div>
            <div className="h-7 w-16 bg-gray-200/80 rounded-md my-1" />
          </div>
          <div className="h-3.5 w-20 bg-gray-100 rounded mt-2.5" />
        </div>

        {/* Card 4: Cleared This Month */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Cleared
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100" />
            </div>
            <div className="h-7 w-16 bg-gray-200/80 rounded-md my-1" />
          </div>
          <div className="h-3.5 w-24 bg-gray-100 rounded mt-2.5" />
        </div>
      </div>

      {/* ── 3. Static Segmented Filter Tabs ── */}
      <div className="w-full">
        <div className="flex items-center p-1 bg-[#eef1f5] rounded-xl w-full sm:w-fit">
          <span className="flex-1 sm:flex-none px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-[#2d3436] shadow-sm text-center">
            All
          </span>
          <span className="flex-1 sm:flex-none px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 text-center">
            You&apos;re Owed
          </span>
          <span className="flex-1 sm:flex-none px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 text-center">
            You Owe
          </span>
        </div>
      </div>

      {/* ── 4. Main White Container with Static Headers ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-4 sm:p-7">
        <div className="relative pl-5 sm:pl-7">
          {/* Continuous Left Vertical Timeline Rail */}
          <div className="absolute left-2 sm:left-2.5 top-3.5 bottom-0 w-[1.5px] bg-gray-200/80 -translate-x-1/2" />

          {/* Timeline Bullet Node */}
          <div className="absolute left-2 sm:left-2.5 top-2.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#8b9dc3] -translate-x-1/2 ring-2 ring-gray-100 z-10" />

          {/* Static Current Month Header Placeholder */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-gray-200/80 rounded-md" />
            <div className="h-4 w-4 bg-gray-100 rounded" />
          </div>

          <div className="space-y-4">
            {/* Static "Needs Attention" Subheader */}
            <div className="flex items-center gap-1.5 px-1 text-rose-500">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-200/70 shrink-0" />
              <span className="text-xs font-bold text-rose-500">
                Needs Attention
              </span>
              <span className="text-[11px] text-gray-400 ml-2 font-normal">
                Pending or partial payments
              </span>
            </div>

            {/* Pulsing Row Skeletons */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-gray-50">
              {[1, 2].map((i) => (
                <div key={i} className="p-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl sm:rounded-full bg-gray-100 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-gray-200/80 rounded" />
                      <div className="h-2.5 w-20 bg-gray-100 rounded" />
                    </div>
                  </div>

                  <div className="hidden sm:block w-32">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                    <div className="h-2 w-16 bg-gray-100 rounded mt-1.5" />
                  </div>

                  <div className="h-4 w-16 bg-gray-200/80 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}