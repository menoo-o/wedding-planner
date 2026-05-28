// components/ExpenseForm/ExpenseModal.tsx
"use client"

import { useEffect } from "react"
import { useDashboard } from "@/app/dashboard/DashboardProvider"
import TransactionForm from "./TransactionForm"

export default function ExpenseModal() {
  const { isExpenseModalOpen, setExpenseModalOpen } = useDashboard()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isExpenseModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isExpenseModalOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpenseModalOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setExpenseModalOpen])

  if (!isExpenseModalOpen) return null

  return (
    // Backdrop — click outside to dismiss
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => setExpenseModalOpen(false)}
    >
      {/* Modal panel — stop propagation so clicks inside don't close */}
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setExpenseModalOpen(false)}
          className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* The form — reads all context internally, no props needed */}
        <TransactionForm onSuccess={() => setExpenseModalOpen(false)} />
      </div>
    </div>
  )
}