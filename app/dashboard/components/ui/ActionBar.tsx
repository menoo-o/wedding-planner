// app/dashboard/components/ui/ActionBar.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowDownRight, ArrowDown, ArrowLeftRight, Plus, ChevronUp } from "lucide-react"
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
}

const TRANSACTION_CHOICES = [
  {
    key: "expense" as const,
    label: "Add expense",
    icon: ArrowDownRight,
    iconBg: "bg-[#fbe9e7]",
    iconColor: "text-[#d85a30]",
  },
  {
    key: "topup" as const,
    label: "Add deposit",
    icon: ArrowDown,
    iconBg: "bg-[#e1f5ee]",
    iconColor: "text-[#0f6e56]",
  },
  {
    key: "loan" as const,
    label: "Debt / loan",
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

  const openModal = (modal: "expense" | "topup" | "loan") => {
    setMenuOpen(false)
    setActiveModal(modal)
  }
  const closeModal = () => setActiveModal(null)
  const router = useRouter()
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
    {/* action-bar.tsx */}
  <div className="relative" ref={barRef}>
  <Toast toast={toast} onDismiss={dismissToast} />

  <div className="flex items-end">
    {TRANSACTION_CHOICES.map((choice, i) => {
      const Icon = choice.icon
      return (
        <button
          key={choice.key}
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

    <button
      onClick={() => setMenuOpen((p) => !p)}
      className="flex items-center gap-2 px-4 py-2 bg-[#2d3436] hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap"
    >
      {menuOpen ? <ChevronUp size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
      New transaction
    </button>
  </div>

  <div
    className={`absolute right-6 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-gray-100/80 rotate-45 transition-opacity duration-200 ${
      menuOpen ? "opacity-100" : "opacity-0"
    }`}
  />
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