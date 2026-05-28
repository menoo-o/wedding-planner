// app/dashboard/DashboardProvider.tsx
"use client"
//app/dashboard/DashboardProvider.tsx
import { createContext, useContext, useState, ReactNode } from "react"

type CategorySummary = { id: string; name: string }

type DashboardContextType = {
  householdId: string
  currentCycleId: string
  createdBy: string
  categories: CategorySummary[]
  isExpenseModalOpen: boolean
  setExpenseModalOpen: (open: boolean) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({
  children,
  initialData,
}: {
  children: ReactNode
  initialData: Omit<DashboardContextType, "isExpenseModalOpen" | "setExpenseModalOpen">
}) {
  // Global modal toggle state managed here
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false)

  return (
    <DashboardContext.Provider value={{ ...initialData, isExpenseModalOpen, setExpenseModalOpen }}>
      {children}
    </DashboardContext.Provider>
  )
}

// Custom hook so any button or form can grab the values instantly
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error("useDashboard must be used within a DashboardProvider")
  return context
}