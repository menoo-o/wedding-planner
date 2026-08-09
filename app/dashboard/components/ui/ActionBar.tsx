// app/dashboard/components/ui/ActionBar.tsx
"use client"

import { useState } from "react"
import { ArrowDownRight, Plus, ArrowLeftRight } from "lucide-react"
import AddExpenseModal from "../modals/AddExpenseModal"
import TopUpForm from "../TopUpForm"
import LoanForm from "../LoanForm"
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

export default function ActionBar({
  householdId,
  currentCycleId,
  createdBy,
  cashBalance,
  cardBalance,
  initialCategories,
}: ActionBarProps) {
  const [activeModal, setActiveModal] = useState<"expense" | "topup" | "loan" | null>(null)

  const openModal = (modal: "expense" | "topup" | "loan") => setActiveModal(modal)
  const closeModal = () => setActiveModal(null)

  return (
    <>
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => openModal("expense")}
          className="flex items-center gap-2 px-5 py-3 bg-[#2d3436] hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <ArrowDownRight size={16} strokeWidth={1.8} />
          Add expense
        </button>

        <button
          onClick={() => openModal("topup")}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-[#2d3436] rounded-xl text-sm font-medium transition-all border border-gray-200 hover:border-gray-300"
        >
          <Plus size={16} strokeWidth={1.8} />
          Add deposit
        </button>

        <button
          onClick={() => openModal("loan")}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-[#2d3436] rounded-xl text-sm font-medium transition-all border border-gray-200 hover:border-gray-300"
        >
          <ArrowLeftRight size={16} strokeWidth={1.8} />
          Debt / loan
        </button>
      </div>

      {/* Expense Modal */}
      <AddExpenseModal
        isOpen={activeModal === "expense"}
        onClose={closeModal}
        categories={initialCategories}
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
        cashBalance={cashBalance}
        cardBalance={cardBalance}
        onCategoryCreated={closeModal}
      />

      {/* Top Up Modal */}
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
        />
      </Modal>

      {/* Loan Modal */}
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
        />
      </Modal>
    </>
  )
}