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
    className={`absolute -top-11 right-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 z-10 ${
      isOpen
        ? "bg-[#2d3436] text-white border-[#2d3436] shadow-md"
        : "bg-white border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-sm"
    }`}
  >
    <Filter size={18} strokeWidth={1.5} />
  </button>

  {/* Collapsible filter bar */}
  <div
    className={`grid transition-all duration-300 ease-in-out ${
      isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
    }`}
  >
    <div className={`${isOpen ? "overflow-visible" : "overflow-hidden"} min-h-0`}>
      <div className="rounded-2xl bg-white p-4 border border-gray-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

        {/* Row 1: Payment source tabs + cycle/category dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
          {/* Payment source tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("payment", opt.value === "all" ? undefined : opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activePayment === opt.value
                    ? "bg-[#2d3436] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Cycle selector dropdown */}
            <div className="relative" ref={cycleRef}>
              <button
                onClick={() => setCycleOpen((p) => !p)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  cycleOpen
                    ? "bg-gray-200 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Calendar size={14} strokeWidth={1.5} className="text-gray-400" />
                <span className="font-semibold">{cycleLabel}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className={`text-gray-400 transition-transform duration-200 ${cycleOpen ? "rotate-180" : ""}`}
                />
              </button>

              {cycleOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 border border-gray-100 py-1.5 z-20">
                  <button
                    onClick={() => {
                      updateParam("cycle", undefined)
                      setCycleOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                      !urlSearchParams.get("cycle")
                        ? "font-semibold text-gray-900 bg-gray-50"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Current cycle
                  </button>
                  <div className="my-1 border-t border-gray-100" />
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
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                          isActive ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cycle.is_closed ? "bg-gray-300" : "bg-emerald-400"}`} />
                        {label}
                        {cycle.is_closed && (
                          <span className="text-[10px] text-gray-400 ml-auto tracking-wide">Closed</span>
                        )}
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
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  categoryOpen
                    ? "bg-gray-200 text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Tag size={14} strokeWidth={1.5} className="text-gray-400" />
                <span className="font-semibold">{activeCatObj?.name || "Category"}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className={`text-gray-400 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}
                />
              </button>

              {categoryOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 border border-gray-100 py-1.5 z-20">
                  <button
                    onClick={() => {
                      updateParam("category", undefined)
                      setCategoryOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                      activeCategory === "all"
                        ? "font-semibold text-gray-900 bg-gray-50"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All categories
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        updateParam("category", cat.id)
                        setCategoryOpen(false)
                      }}
                      className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                        activeCategory === cat.id
                          ? "font-semibold text-gray-900 bg-gray-50"
                          : "text-gray-600 hover:bg-gray-50"
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
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                      activeCategory === "reimbursements"
                        ? "font-semibold text-gray-900 bg-gray-50"
                        : "text-gray-600 hover:bg-gray-50"
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
            className={`flex-1 min-w-[220px] flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-150 ${
              searchFocused
                ? "bg-white border border-gray-300 shadow-sm ring-1 ring-gray-100"
                : "bg-gray-100 border border-transparent"
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
                className="p-0.5 hover:bg-gray-200 rounded-md transition-colors duration-100"
              >
                <X size={14} strokeWidth={1.5} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}

            {/* Submit / Enter Action Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSearchSubmit}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-200 hover:bg-gray-800 hover:text-white px-2 py-1 rounded-md transition-all duration-150 shrink-0"
            >
              <span>Search</span>
              <kbd className="text-[9px] font-mono bg-white/80 px-1 rounded text-gray-500 border border-gray-300">↵</kbd>
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((p) => !p)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                sortOpen
                  ? "bg-gray-200 text-gray-900"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ArrowUpDown size={14} strokeWidth={1.5} className="text-gray-400" />
              {activeSortLabel}
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`text-gray-400 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 border border-gray-100 py-1.5 z-20">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateParam("sort", opt.value === "date_newest" ? undefined : opt.value)
                      setSortOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                      activeSort === opt.value
                        ? "font-semibold text-gray-900 bg-gray-50"
                        : "text-gray-600 hover:bg-gray-50"
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
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors duration-150"
            >
              <X size={12} strokeWidth={2} />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
  </>
)}