// app/dashboard/components/ui/ActionBarSkeleton.tsx
//this is for layout.tsx
import BrandLogo from "./BrandLogo"

export default function ActionBarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="
        relative z-30 flex items-center px-4 sm:px-6 pt-4 pb-3 animate-pulse
        lg:fixed lg:top-6 lg:right-8 lg:z-50 lg:gap-1.5 lg:p-1.5
        lg:bg-white/95 lg:backdrop-blur-md lg:rounded-2xl
        lg:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)]
        lg:border lg:border-gray-200/70 lg:ring-1 lg:ring-black/[0.02]
      "
    >
      {/* Mobile only: logo placeholder, pushes the icons to the right */}
       <BrandLogo className="mr-auto lg:hidden" />

      {/* Mobile: the "New transaction" button, on the title row's right edge.
          Desktop: first block inside the pill */}
      <div className="absolute right-4 sm:right-6 top-full mt-1 z-40 h-9 w-40 rounded-xl bg-gray-100 lg:static lg:mt-0 lg:w-24" />

      {/* Desktop only: second pill block + divider */}
      <div className="hidden lg:block h-9 w-24 rounded-xl bg-gray-100" />
      <div className="hidden lg:block w-px h-6 bg-gray-200/70 mx-0.5" />

      {/* Refresh is desktop only, so mobile shows just bell + avatar */}
      <div className="hidden lg:block h-9 w-9 rounded-xl bg-gray-100" />
      <div className="h-9 w-9 rounded-xl bg-gray-100 ml-1.5 lg:ml-0" />
      <div className="h-9 w-9 rounded-xl bg-gray-100 ml-1.5 lg:ml-0" />
    </div>
  )
}