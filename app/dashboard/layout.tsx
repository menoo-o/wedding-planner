// app/dashboard/layout.tsx

import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import SidebarNav from "@/app/dashboard/components/SidebarNav"
import { ReactNode } from "react"
import DashboardHeaderBar from "@/app/dashboard/components/Dashboardheaderbar"
import ActionBarSkeleton from "@/app/dashboard/components/ActionBarSkeleton"

// Note: getDashboardData() and getLiveServerLiquidity() no longer live here —
// they moved into DashboardHeaderBar, which is the only part of this layout
// that actually depends on them. That lets the static shell (sidebar, logo)
// render immediately instead of blocking on those fetches.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans">
      {/* Sidebar */}
      <aside className="w-56 bg-white flex flex-col fixed h-full border-r border-gray-100/50 z-40">
        {/* Logo */}
        <div className="p-5 pb-3">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-26 h-18 overflow-visible shrink-0 flex items-center justify-center">
              <Image
                src="/logo-v1.png"
                alt="Simply Finance"
                fill
                sizes="(max-width: 768px) 120px, 160px"
                className="object-contain scale-150 origin-center transition-transform duration-300 group-hover:scale-160"
                priority
              />
            </div>
            <p className="text-[10px] text-gray-400 tracking-[0.15em] uppercase font-medium">
              Simply Finance
            </p>
          </Link>
        </div>

        {/* Nav + Logout (client component: needs usePathname + onClick) */}
        <SidebarNav />
      </aside>

      {/* Left ICON Content Area */}
      <div className="flex-1 ml-56 min-h-screen relative">
        <Suspense fallback={<ActionBarSkeleton />}>
          <DashboardHeaderBar />
        </Suspense>

        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}