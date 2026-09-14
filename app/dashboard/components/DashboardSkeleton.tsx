// ── Skeleton ──────────────────────────────────────────────────
// Mirrors the actual dashboard's structure (top bar, 4 snapshot cards,
// 3 insight cards, recent activity + spending analysis) and is responsive
// down to mobile, matching the real layout's breakpoints.

 function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-lg ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0 p-4 sm:p-8 animate-pulse">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-32 sm:w-40" />
          <SkeletonBlock className="h-3 w-48 sm:w-64" />
        </div>
      </div>

      {/* ── Financial Snapshot ───────────────────────────────── */}
      <div className="mb-2">
        <SkeletonBlock className="h-3 w-40" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100/80 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-3.5 w-3.5 rounded-full" />
              <SkeletonBlock className="h-2.5 w-16" />
            </div>
            <SkeletonBlock className="h-6 w-24" />
            <SkeletonBlock className="h-2.5 w-32" />
          </div>
        ))}
      </div>

      {/* ── Insight Cards Row ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`rounded-2xl p-6 shadow-sm space-y-4 ${
              i === 2 ? "bg-[#2d3436]/10 sm:col-span-2 lg:col-span-1" : "bg-white border border-gray-100/80"
            }`}
          >
            <SkeletonBlock className="h-2.5 w-28" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* ── Recent Activity + Spending Analysis ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="h-2.5 w-28" />
            <SkeletonBlock className="h-2.5 w-14" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <SkeletonBlock className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <SkeletonBlock className="h-3 w-24 sm:w-32" />
                    <SkeletonBlock className="h-2.5 w-16" />
                  </div>
                </div>
                <SkeletonBlock className="h-3 w-14 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Spending Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm space-y-5">
          <SkeletonBlock className="h-2.5 w-32" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <SkeletonBlock className="h-2.5 w-16" />
                <SkeletonBlock className="h-2.5 w-8" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton