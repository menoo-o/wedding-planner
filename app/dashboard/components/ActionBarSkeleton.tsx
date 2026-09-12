// app/dashboard/components/ui/ActionBarSkeleton.tsx
//this is for layout.tsx
export default function ActionBarSkeleton() {
  return (
    <div
      className="fixed top-6 right-8 z-50 flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)] border border-gray-200/70 ring-1 ring-black/[0.02] p-1.5 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-9 w-24 rounded-xl bg-gray-100" />
      <div className="h-9 w-24 rounded-xl bg-gray-100" />

      <div className="w-px h-6 bg-gray-200/70 mx-0.5" />

      <div className="h-9 w-9 rounded-xl bg-gray-100" />
      <div className="h-9 w-9 rounded-xl bg-gray-100" />
      <div className="h-9 w-9 rounded-xl bg-gray-100" />
    </div>
  )
}