"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  HandCoins,
  PiggyBank,
  BarChart3,
  Store,
  Settings,
  LogOut,
} from "lucide-react"

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

async function handleLogout() {
  const { createClient } = await import("@/utils/supabase/client")
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = "/login"
}

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {SIDEBAR_NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
      </nav>

      <div className="p-3 border-t border-gray-50 space-y-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group mt-2"
        >
          <LogOut size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </>
  )
}

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