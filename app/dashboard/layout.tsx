// app/dashboard/layout.tsx

import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import SidebarNav from "@/app/dashboard/components/SidebarNav"
import { ReactNode } from "react"
import DashboardHeaderBar from "@/app/dashboard/components/Dashboardheaderbar"
import ActionBarSkeleton from "@/app/dashboard/components/ActionBarSkeleton"
import MobileBottomNav from "./components/MobileNav"
import BrandLogo from "@/app/dashboard/components/BrandLogo"

// Note: getDashboardData() and getLiveServerLiquidity() no longer live here —
// they moved into DashboardHeaderBar, which is the only part of this layout
// that actually depends on them. That lets the static shell (sidebar, logo)
// render immediately instead of blocking on those fetches.
//app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
     <div className="min-h-screen bg-[#f0f2f5] flex font-sans">
      {/* Sidebar */}
     <aside className="hidden lg:flex w-56 bg-white flex-col fixed h-full border-r border-gray-100/50 z-40">
        {/* Logo */}
     <BrandLogo className="p-5 pb-3" />
     
        {/* Nav + Logout (client component: needs usePathname + onClick) */}
        <SidebarNav />
      </aside>

      {/* Left ICON Content Area */}
     <div className="flex-1 min-w-0 lg:ml-56 min-h-screen relative">
        <Suspense fallback={<ActionBarSkeleton />}>
          <DashboardHeaderBar />
        </Suspense>


         <main className="pb-28 lg:p-8">{children}</main>
      </div>
       <MobileBottomNav />
    </div>
  )
}