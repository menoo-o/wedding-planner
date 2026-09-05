// app/dashboard/debts/_components/DebtsSkeleton.tsx

export default function DebtsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200/80 rounded-lg" />
          <div className="h-4 w-72 bg-gray-100 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-gray-200/80 rounded-xl" />
          <div className="h-10 w-36 bg-gray-200/60 rounded-xl" />
        </div>
      </div>

      {/* 2. Top 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="w-8 h-8 rounded-full bg-gray-100" />
            </div>
            <div className="h-7 w-32 bg-gray-200/80 rounded-md" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Filter Controls Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="h-10 w-64 bg-gray-200/60 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-60 bg-gray-200/60 rounded-xl" />
          <div className="h-10 w-20 bg-gray-200/60 rounded-xl" />
        </div>
      </div>

      {/* 4. People Rollup Rail Skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-32 bg-gray-200/80 rounded" />
        <div className="flex items-center gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-white w-48 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-20 bg-gray-200/80 rounded" />
                <div className="h-2 w-14 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Ledger Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="col-span-4 h-3 w-28 bg-gray-200/60 rounded" />
          <div className="col-span-2 h-3 w-16 bg-gray-200/60 rounded" />
          <div className="col-span-1 h-3 w-12 bg-gray-200/60 rounded" />
          <div className="col-span-3 h-3 w-32 bg-gray-200/60 rounded" />
          <div className="col-span-2 h-3 w-16 bg-gray-200/60 rounded ml-auto" />
        </div>

        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-gray-100" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-200/80 rounded" />
                  <div className="h-2.5 w-44 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-lg" />
              <div className="h-5 w-14 bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-200/80 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}