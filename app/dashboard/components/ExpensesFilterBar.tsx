// app/dashboard/components/ExpensesFilterBar.tsx
"use client"
import type { ReactElement } from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Calendar,
  Filter,
  Tag,
  ArrowUpDown,
  CreditCard,
  Banknote,
  User,
} from "lucide-react"

interface Cycle {
  id: string
  created_at: string
  is_closed: boolean
  
}

interface Category {
  id: string
  name: string
}

type PaymentSource = "cash" | "card" | "someone_else" | "all"

type SortOption =
  | "date_newest"
  | "date_oldest"
  | "amount_high_low"
  | "amount_low_high"
  | "pending_first"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_newest", label: "Date: Newest first" },
  { value: "date_oldest", label: "Date: Oldest first" },
  { value: "amount_high_low", label: "Amount: High to low" },
  { value: "amount_low_high", label: "Amount: Low to high" },
  { value: "pending_first", label: "Pending debts first" },
]

const PAYMENT_OPTIONS: { value: PaymentSource; label: string; icon: ReactElement }[] = [
  { value: "all", label: "All sources", icon: <SlidersHorizontal size={14} strokeWidth={1.5} /> },
  { value: "cash", label: "Cash", icon: <Banknote size={14} strokeWidth={1.5} /> },
  { value: "card", label: "Card", icon: <CreditCard size={14} strokeWidth={1.5} /> },
  { value: "someone_else", label: "Someone else", icon: <User size={14} strokeWidth={1.5} /> },
]

interface ExpensesFilterBarProps {
  cycles: Cycle[]
  categories: Category[]
  currentCycleId: string
  activeCategory: string
  activePayment: string
    mode?: "toggle" | "panel" | "full"

  activeSort: string
  searchQuery: string
}

export default function ExpensesFilterBar({
  cycles,
  categories,
  // mode = "full",
  currentCycleId,
  activeCategory,
  activePayment,
  activeSort,

  searchQuery,
}: ExpensesFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()

  const [search, setSearch] = useState(searchQuery)
  const [searchFocused, setSearchFocused] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [cycleOpen, setCycleOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // New state to control the visibility of the filter bar
  const sortRef = useRef<HTMLDivElement>(null)
  const cycleRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  

// 2. Track previous prop during rendering
const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)

 // 1. Declare updateParam FIRST so it's initialized before handlers reference it
  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(urlSearchParams.toString())
      if (value === undefined || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, urlSearchParams]
  )

  // 2. Adjust local state during rendering when props change (No cascading useEffect)
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery)
    setSearch(searchQuery || "")
  }

  // 3. Search triggers (Enter keypress & Button click)
  const handleSearchSubmit = () => {
    updateParam("search", search.trim() || undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearchSubmit()
    }
  }

  // 4. Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (cycleRef.current && !cycleRef.current.contains(e.target as Node)) setCycleOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const hasActiveFilters =
    searchQuery !== "" ||
    activePayment !== "all" ||
    activeSort !== "date_newest" ||
    activeCategory !== "all" ||
    urlSearchParams.get("cycle") !== null

  function clearFilters() {
    router.push(pathname, { scroll: false })
    setSearch("")
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === activeSort)?.label
  const activeCycle = cycles.find((c) => c.id === (urlSearchParams.get("cycle") || currentCycleId))
  const cycleLabel = activeCycle?.created_at
    ? new Date(activeCycle.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Current"

  const activeCatObj = categories.find((c) => c.id === activeCategory)
return (
  <>
   <div className="relative">
      {/* Toggle button — positioned at top-right, aligned with tabs row */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className={`absolute -top-11 right-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all z-10 ${
          isOpen
            ? "bg-[#2d3436] text-white border-[#2d3436]"
            : "bg-white border-gray-100 text-gray-400 hover:text-gray-600 hover:shadow-sm"
        }`}
      >
        <Filter size={18} strokeWidth={1.5} />
      </button>
    {/* Collapsible filter bar */}
          {/* Collapsible filter panel — full width */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
       <div className={`${isOpen ? "overflow-visible" : "overflow-hidden"} min-h-0`}>
          <div className="rounded-2xl bg-white p-4 border border-gray-100/80 shadow-sm">
            {/* Row 1: Payment source tabs + cycle/category dropdowns */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              {/* Payment source tabs */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateParam("payment", opt.value === "all" ? undefined : opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activePayment === opt.value
                        ? "bg-[#2d3436] text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2"></div>
            {/* Cycle selector dropdown */}
            <div className="relative" ref={cycleRef}>
              <button
                onClick={() => setCycleOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Calendar size={14} strokeWidth={1.5} />
                <span className="font-semibold">{cycleLabel}</span>
                <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${cycleOpen ? "rotate-180" : ""}`} />
              </button>

              {cycleOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => {
                      updateParam("cycle", undefined)
                      setCycleOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      !urlSearchParams.get("cycle") ? "font-semibold text-gray-900" : "text-gray-600"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Current cycle
                  </button>
                  {cycles.map((cycle) => {
                    const label = new Date(cycle.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                    const isActive = cycle.id === urlSearchParams.get("cycle")
                    return (
                      <button
                        key={cycle.id}
                        onClick={() => {
                          updateParam("cycle", cycle.id)
                          setCycleOpen(false)
                        }}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          isActive ? "font-semibold text-gray-900" : "text-gray-600"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cycle.is_closed ? "bg-gray-300" : "bg-green-400"}`} />
                        {label}
                        {cycle.is_closed && <span className="text-[10px] text-gray-400 ml-auto">Closed</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Category selector dropdown */}
            <div className="relative" ref={categoryRef}>
              <button
                onClick={() => setCategoryOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Tag size={14} strokeWidth={1.5} />
                <span className="font-semibold">{activeCatObj?.name || "Category"}</span>
                <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
              </button>

              {categoryOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => {
                      updateParam("category", undefined)
                      setCategoryOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      activeCategory === "all" ? "font-semibold text-gray-900" : "text-gray-600"
                    }`}
                  >
                    All categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        updateParam("category", cat.id)
                        setCategoryOpen(false)
                      }}
                      className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        activeCategory === cat.id ? "font-semibold text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      updateParam("category", "reimbursements")
                      setCategoryOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      activeCategory === "reimbursements" ? "font-semibold text-gray-900" : "text-gray-600"
                    }`}
                  >
                    Reimbursements
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Row 2: Search, sort, clear */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Merchant search container */}
            <div
              className={`flex-1 min-w-[220px] flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                searchFocused ? "bg-white border border-gray-300 shadow-sm" : "bg-gray-100 border border-transparent"
              }`}
            >
              <Search size={14} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
              
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search description, merchant, or category..."
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-gray-400 text-[#2d3436]"
              />

              {/* Clear Search Button */}
              {search && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearch("")
                    updateParam("search", undefined)
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X size={14} strokeWidth={1.5} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* Submit / Enter Action Button */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSearchSubmit}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-200 hover:bg-gray-300 hover:text-gray-800 px-2 py-1 rounded-md transition-all shrink-0"
              >
                <span>Search</span>
                <kbd className="text-[9px] font-mono bg-white/70 px-1 rounded text-gray-500 border border-gray-300">↵</kbd>
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ArrowUpDown size={14} strokeWidth={1.5} />
                {activeSortLabel}
                <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateParam("sort", opt.value === "date_newest" ? undefined : opt.value)
                        setSortOpen(false)
                      }}
                      className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        activeSort === opt.value ? "font-semibold text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <X size={12} strokeWidth={2} />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
)}