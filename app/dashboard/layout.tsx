// app/dashboard/layout.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import RefreshButton from "@/app/dashboard/components/refreshStats"

import { ReactNode } from "react"
import {
  LayoutDashboard,
  Receipt,
  HandCoins,
  PiggyBank,
  BarChart3,
  Store,
  Settings,
  Bell,
  LogOut,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const SIDEBAR_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { label: "Expenses", href: "/dashboard/expenses", icon: <Receipt size={18} strokeWidth={1.5} /> },
  { label: "Debts & Receivables", href: "/dashboard/debts", icon: <HandCoins size={18} strokeWidth={1.5} /> },
  { label: "Savings", href: "/dashboard/savings", icon: <PiggyBank size={18} strokeWidth={1.5} /> },
  { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { label: "Vendors", href: "/dashboard/vendors", icon: <Store size={18} strokeWidth={1.5} /> },
]

const BOTTOM_NAV: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.5} /> },
]

// ── Logout Action ─────────────────────────────────────────────

async function handleLogout() {
  // Adjust this to match your auth setup (Supabase, NextAuth, etc.)
  // Example for Supabase:
  const { createClient } = await import("@/utils/supabase/client")
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = "/login"
}

// ── Layout ────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()


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

        {/* Main Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {SIDEBAR_NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-50 space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group mt-2"
          >
            <LogOut
              size={18}
              strokeWidth={1.5}
              className="group-hover:scale-110 transition-transform"
            />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-56 min-h-screen relative">
        {/* Floating Top-Right Action Controls (Does NOT push content down) */}
        <div className="fixed top-6 right-8 z-50 flex items-center gap-3">
          {/* Refresh Button */}
          <RefreshButton />

          {/* Notifications Button */}
          <button 
            type="button"
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200/70 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow transition-all relative"
          >
            <Bell size={18} strokeWidth={1.5} />
          </button>

          {/* Profile Avatar */}
          <div className="w-10 h-10 rounded-xl bg-[#dfe6e9] border border-gray-200/50 shadow-sm flex items-center justify-center text-[#636e72] font-bold text-sm">
            {/* householdMember?.role?.charAt(0).toUpperCase() || "U" */}
            U
          </div>
        </div>

        {/* Page Content takes 100% of the screen naturally */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>  
  )
}

// ── Nav Link Component ────────────────────────────────────────

function NavLink({ href, label, icon, pathname }: NavItem & { pathname: string }) {
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-[#e8eaf0] text-[#2d3436] shadow-sm"
          : "text-gray-500 hover:bg-gray-50 hover:text-[#2d3436]"
      }`}
    >
      <span className={isActive ? "text-[#8b9dc3]" : "text-gray-400"}>{icon}</span>
      {label}
    </Link>
  )
}