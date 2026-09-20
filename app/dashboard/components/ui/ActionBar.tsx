// app/dashboard/components/ui/ActionBar.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowDownRight, ArrowDown, ArrowLeftRight, Plus, ChevronUp, ChevronDown } from "lucide-react"
import AddExpenseModal from "../modals/AddExpenseModal"
import TopUpForm from "../TopUpForm"
import LoanForm from "../LoanForm"
import Toast, { useToast } from "../Toast"
import { useRouter } from "next/navigation"
import Modal from "./Model"

interface Category {
  id: string
  name: string
}

interface ActionBarProps {
  householdId: string
  currentCycleId: string
  createdBy: string
  cashBalance: number
  cardBalance: number
  initialCategories: Category[]
  userInitial?: string
}

const TRANSACTION_CHOICES = [
  {
    key: "expense" as const,
    label: "Add Expense",
    icon: ArrowDownRight,
    iconBg: "bg-[#fbe9e7]",
    iconColor: "text-[#d85a30]",
  },
  {
    key: "topup" as const,
    label: "Add Deposit",
    icon: ArrowDown,
    iconBg: "bg-[#e1f5ee]",
    iconColor: "text-[#0f6e56]",
  },
  {
    key: "loan" as const,
    label: "Debt / Loan",
    icon: ArrowLeftRight,
    iconBg: "bg-[#eeedfe]",
    iconColor: "text-[#534ab7]",
  },
]
export default function ActionBar({
  householdId,
  currentCycleId,
  createdBy,
  cashBalance,
  cardBalance,
  initialCategories,
}: ActionBarProps) {
  const [activeModal, setActiveModal] = useState<"expense" | "topup" | "loan" | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const { toast, show: showToast, dismiss: dismissToast } = useToast()
  const router = useRouter()

  const openModal = (modal: "expense" | "topup" | "loan") => {
    setMenuOpen(false)
    setActiveModal(modal)
  }
  const closeModal = () => setActiveModal(null)
  const handleCategoryCreated = () => {
    router.refresh()
  }

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [menuOpen])

  return (
    <>
      <div className="relative flex items-center justify-end" ref={barRef}>
        <Toast toast={toast} onDismiss={dismissToast} />

        {/* ── DESKTOP ONLY: Horizontal inline sliding pills ── */}
        <div className="hidden sm:flex items-center">
          {TRANSACTION_CHOICES.map((choice, i) => {
            const Icon = choice.icon
            return (
              <button
                key={choice.key}
                type="button"
                onClick={() => openModal(choice.key)}
                style={{ transitionDelay: menuOpen ? `${i * 40}ms` : "0ms" }}
                className={`flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-xl text-sm font-medium text-[#2d3436] whitespace-nowrap hover:bg-gray-50 transition-all duration-200 ease-out overflow-hidden ${
                  menuOpen
                    ? "opacity-100 max-w-[180px] scale-100"
                    : "opacity-0 max-w-0 scale-95 pl-0 pr-0 pointer-events-none"
                }`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${choice.iconBg}`}>
                  <Icon size={14} strokeWidth={2} className={choice.iconColor} />
                </span>
                {choice.label}
              </button>
            )
          })}
        </div>

        {/* ── Main Trigger CTA Button ── */}
        <button
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#2d3436] hover:bg-black text-white rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 shadow-sm whitespace-nowrap shrink-0"
        >
          {menuOpen ? <ChevronUp size={15} strokeWidth={2} /> : <Plus size={15} strokeWidth={2} />}
          New transaction
        </button>

        {/* ── MOBILE ONLY: Dropdown card below button (Extended wider & shifted left) ── */}
        <div
          className={`sm:hidden absolute top-full right-0 mt-3.5 w-[calc(100vw-1.5rem)] max-w-md z-50 transition-all duration-200 ease-out origin-top-right ${
            menuOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
          }`}
        >
          {/* Upward Pointer Arrow aligned with the trigger button on the right */}
          <div className="absolute right-6 -top-1.5 w-3.5 h-3.5 bg-white border-l border-t border-gray-100 rotate-45" />

          {/* White Card with Divided Columns */}
          <div className="relative bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-1.5 grid grid-cols-3 divide-x divide-gray-100">
            { TRANSACTION_CHOICES.map((choice) => {
              const Icon = choice.icon
              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => openModal(choice.key)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-1 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors text-center"
                >
                  {/* Restored colored circle background badges for the icons */}
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${choice.iconBg}`}>
                    <Icon size={13} strokeWidth={2} className={choice.iconColor} />
                  </span>
                  <span className="text-[11px] font-semibold text-[#2d3436] tracking-tight leading-tight">
                    {choice.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {activeModal === "expense" && (
        <AddExpenseModal
          isOpen={true}
          onClose={closeModal}
          categories={initialCategories}
          householdId={householdId}
          currentCycleId={currentCycleId}
          createdBy={createdBy}
          cashBalance={cashBalance}
          cardBalance={cardBalance}
          showToast={showToast}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      <Modal
        isOpen={activeModal === "topup"}
        onClose={closeModal}
        title="Add deposit"
        subtitle="Record new funds entering your household"
      >
        <TopUpForm
          householdId={householdId}
          currentCycleId={currentCycleId}
          createdBy={createdBy}
          onSuccess={closeModal}
          showToast={showToast}
        />
      </Modal>

      <Modal
        isOpen={activeModal === "loan"}
        onClose={closeModal}
        title="Record loan"
        subtitle="Track money borrowed or lent"
      >
        <LoanForm
          householdId={householdId}
          currentCycleId={currentCycleId}
          createdBy={createdBy}
          cashBalance={cashBalance}
          cardBalance={cardBalance}
          onSuccess={closeModal}
          showToast={showToast}
        />
      </Modal>
    </>
  )
}