"use client"

// app/dashboard/components/MobileBottomNav.tsx
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  HandCoins,
  PiggyBank,
  MoreHorizontal,
  BarChart3,
  Store,
  Settings,
  LogOut,
} from "lucide-react"

type TabItem = { label: string; href: string; icon: ReactNode }
type MoreItem = TabItem & { hint: string }

const ICON = { size: 22, strokeWidth: 1.5 }

const TABS: TabItem[] = [
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard {...ICON} /> },
  { label: "Expenses", href: "/dashboard/expenses", icon: <Receipt {...ICON} /> },
  { label: "Debts", href: "/dashboard/debts", icon: <HandCoins {...ICON} /> },
  { label: "Savings", href: "/dashboard/savings", icon: <PiggyBank {...ICON} /> },
]

// Everything that lives behind "More". Analytics is included so it isn't
// orphaned on mobile now that it's not one of the four main tabs.
const MORE_ITEMS: MoreItem[] = [
  { label: "Analytics", hint: "Trends and reports", href: "/dashboard/analytics", icon: <BarChart3 size={18} strokeWidth={1.5} /> },
  { label: "Vendors", hint: "People and shops you pay", href: "/dashboard/vendors", icon: <Store size={18} strokeWidth={1.5} /> },
  { label: "Settings", hint: "Account and preferences", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.5} /> },
]

async function handleLogout() {
  const { createClient } = await import("@/utils/supabase/client")
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = "/login"
}

function isRouteActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
}

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the menu whenever the route changes
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [moreOpen])

  // "More" reads as active when you're on one of the pages inside it
  const moreActive = MORE_ITEMS.some((item) => isRouteActive(pathname, item.href))

  return (
    <div className="lg:hidden">
      {/* Backdrop: tap anywhere outside to dismiss */}
      <div
        onClick={() => setMoreOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#2d3436]/25 backdrop-blur-[2px] transition-opacity duration-200 ${
          moreOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* More menu, anchored above the More tab */}
      <div
        id="more-menu"
        role="menu"
        aria-label="More pages"
        aria-hidden={!moreOpen}
        className={`fixed right-3 z-50 w-[17rem] origin-bottom-right rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-[#2d3436]/10 transition-all duration-200 ease-out bottom-[calc(4.5rem+env(safe-area-inset-bottom))] ${
          moreOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        <ul className="space-y-0.5">
          {MORE_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  tabIndex={moreOpen ? 0 : -1}
                  className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-200 ${
                    active ? "bg-[#e8eaf0]" : "hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-white text-[#8b9dc3] shadow-sm" : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#2d3436]">{item.label}</span>
                    <span className="block truncate text-xs text-gray-400">{item.hint}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mx-2 my-2 border-t border-gray-100" />

        <button
          type="button"
          role="menuitem"
          tabIndex={moreOpen ? 0 : -1}
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-200 hover:bg-red-50 active:bg-red-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-white group-hover:text-red-500">
            <LogOut size={18} strokeWidth={1.5} />
          </span>
          <span className="text-sm font-medium text-gray-500 transition-colors group-hover:text-red-500">
            Sign out
          </span>
        </button>
      </div>

      {/* Bottom bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid h-[4.5rem] max-w-md grid-cols-5 px-2">
          {TABS.map((tab) => {
            const active = isRouteActive(pathname, tab.href)
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full flex-col items-center justify-center gap-1"
                >
                  <TabIcon active={active}>{tab.icon}</TabIcon>
                  <TabLabel active={active}>{tab.label}</TabLabel>
                </Link>
              </li>
            )
          })}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              className="flex h-full w-full flex-col items-center justify-center gap-1"
            >
              <TabIcon active={moreOpen || moreActive}>
                <MoreHorizontal {...ICON} />
              </TabIcon>
              <TabLabel active={moreOpen || moreActive}>More</TabLabel>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

function TabIcon({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${
        active ? "bg-[#e8eaf0] text-[#2d3436]" : "text-gray-400"
      }`}
    >
      {children}
    </span>
  )
}

function TabLabel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={`text-[11px] leading-none transition-colors duration-200 ${
        active ? "font-semibold text-[#2d3436]" : "font-medium text-gray-400"
      }`}
    >
      {children}
    </span>
  )
}