// app/dashboard/_db/emergencySpend.ts
import { cache } from "react"
import { createClient } from "@/utils/supabase/server"
import type { VaultExpenseCategory } from "@/app/dashboard/_db/vaultExpenses"

export interface EmergencySpendRow {
  id: string
  household_id: string
  created_by: string
  title: string
  payee_name: string | null
  category: VaultExpenseCategory
  amount: number
  vault_balance_after: number
  status: "planned" | "paid" | "cancelled"
  due_date: string | null
  paid_at: string | null
  recurrence: string | null
  notes: string | null
  created_at: string
}

export interface EmergencySpendPageData {
  selectedYear: number
  availableYears: number[]
  allTimeTotalSpend: number
  stats: {
    availableEmergencyBalance: number
    spentInYear: number
    yearOverYearDelta: number // percentage
    expensesCount: number
    categoryCountsText: string // e.g. "1 medical • 1 education • 1 legal"
    largestExpenseAmount: number
    largestExpenseTitle: string | null
  }
  expenses: EmergencySpendRow[]
}

export const getEmergencySpendData = cache(
  async (householdId: string, targetYear = new Date().getFullYear()): Promise<EmergencySpendPageData> => {
    const supabase = await createClient()

  // 1. Fetch available Emergency Fund balance directly from households
  const { data: householdRow, error: hhErr } = await supabase
    .from("households")
    .select("savings_balance, savings_wallet_name")
    .eq("id", householdId)
    .single()

  if (hhErr) {
    console.error("Failed to load household vault balance:", hhErr.message)
  }

  const availableEmergencyBalance = Number(householdRow?.savings_balance) || 0

    // 2. Fetch all expenses for this household
    const { data: allRawTxs } = await supabase
      .from("vault_expenses")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })

    const allRecords = (allRawTxs || []) as EmergencySpendRow[]

    // 3. Compute available years
    const yearsSet = new Set<number>()
    yearsSet.add(targetYear)
    for (const r of allRecords) {
      const yr = new Date(r.created_at).getFullYear()
      if (!isNaN(yr)) yearsSet.add(yr)
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a)

    // 4. Lifetime total spend
    let allTimeTotalSpend = 0
    let spentInYear = 0
    let spentPrevYear = 0
    let largestExpenseAmount = 0
    let largestExpenseTitle: string | null = null

    const yearItems: EmergencySpendRow[] = []
    const categoryCountMap: Record<string, number> = {}

    for (const r of allRecords) {
      const amt = Number(r.amount) || 0
      if (r.status === "paid") {
        allTimeTotalSpend += amt

        const yr = new Date(r.created_at).getFullYear()
        if (yr === targetYear) {
          spentInYear += amt
          yearItems.push(r)

          // Category counters for current year
          categoryCountMap[r.category] = (categoryCountMap[r.category] || 0) + 1

          // Track largest single hit
          if (amt > largestExpenseAmount) {
            largestExpenseAmount = amt
            largestExpenseTitle = r.title
          }
        } else if (yr === targetYear - 1) {
          spentPrevYear += amt
        }
      } else if (new Date(r.created_at).getFullYear() === targetYear) {
        // Include planned items in list view
        yearItems.push(r)
      }
    }

    // YoY Delta calculation
    let yearOverYearDelta = 0
    if (spentPrevYear > 0) {
      yearOverYearDelta = Math.round(((spentInYear - spentPrevYear) / spentPrevYear) * 100)
    }

    // Formatted category breakdown string
    const categoryParts = Object.entries(categoryCountMap)
      .slice(0, 3)
      .map(([cat, count]) => `${count} ${cat}`)
    const categoryCountsText = categoryParts.length > 0 ? categoryParts.join(" • ") : "No categories yet"

    return {
      selectedYear: targetYear,
      availableYears,
      allTimeTotalSpend,
      stats: {
        availableEmergencyBalance,
        spentInYear,
        yearOverYearDelta,
        expensesCount: yearItems.length,
        categoryCountsText,
        largestExpenseAmount,
        largestExpenseTitle,
      },
      expenses: yearItems,
    }
  }
)