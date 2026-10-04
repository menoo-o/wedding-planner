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
    yearOverYearDelta: number
    paidExpensesCount: number
    plannedCount: number
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

    let allTimeTotalSpend = 0
    let spentInYear = 0
    let spentPrevYear = 0
    let largestExpenseAmount = 0
    let largestExpenseTitle: string | null = null

    const yearItems: EmergencySpendRow[] = []
    let paidExpensesCount = 0
    let plannedCount = 0

    for (const r of allRecords) {
      const amt = Number(r.amount) || 0
      const yr = new Date(r.created_at).getFullYear()

      if (r.status === "paid") {
        allTimeTotalSpend += amt

        if (yr === targetYear) {
          spentInYear += amt
          paidExpensesCount += 1

          // Track largest hit in target year
          if (amt > largestExpenseAmount) {
            largestExpenseAmount = amt
            largestExpenseTitle = r.title
          }
        } else if (yr === targetYear - 1) {
          spentPrevYear += amt
        }
      } else if (r.status === "planned" && yr === targetYear) {
        plannedCount += 1
      }

      // Include all expenses (settled & planned) for current target year
      if (yr === targetYear) {
        yearItems.push(r)
      }
    }

    // 4. Calculate Year-Over-Year Delta
    let yearOverYearDelta = 0
    if (spentPrevYear > 0) {
      yearOverYearDelta = Math.round(((spentInYear - spentPrevYear) / spentPrevYear) * 100)
    }

    return {
      selectedYear: targetYear,
      availableYears,
      allTimeTotalSpend,
      stats: {
        availableEmergencyBalance,
        spentInYear,
        yearOverYearDelta,
        paidExpensesCount,
        plannedCount,
        largestExpenseAmount,
        largestExpenseTitle,
      },
      expenses: yearItems,
    }
  }
)