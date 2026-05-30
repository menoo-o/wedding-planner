import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { HouseholdMember, MonthlyCycle, Category } from '@/lib/types'



export async function readSupaTables() {
  const supabase = await createClient()

  // 1. Auth
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    console.error("Error fetching user claims:", error)
    redirect("/login")
  }

  // 2. Initialize shared state
  let householdMember: HouseholdMember | null = null
  let monthlyCycle: MonthlyCycle | null = null
  let categories: Category[] = []

  let cashBalance = 0
  let cardBalance = 0

  // 3. Household member
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role, status, user_id")
    .eq("user_id", data.claims.sub)
    .eq("status", "active")
    .single<HouseholdMember>()

  if (memberError || !memberData) {
    console.error("Failed to fetch household member:", memberError)

    return {
      householdMember: null,
      monthlyCycle: null,
      categories: [],
      cash: 0,
      card: 0,
      total: 0,
    }
  }

  householdMember = memberData

  // 4. Monthly cycle
  const { data: cycle, error: cycleError } = await supabase
    .from("monthly_cycles")
    .select("*")
    .eq("household_id", memberData.household_id)
    .eq("is_closed", false)
    .single<MonthlyCycle>()

  if (cycleError) {
    console.error("Failed to fetch monthly cycle:", cycleError)
  } else {
    monthlyCycle = cycle
  }

  const openingBalance = cycle?.opening_balance ?? 0

  cashBalance = openingBalance

  // 5. Transactions
  if (cycle?.id) {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, transaction_type, payment_account")
      .eq("household_id", memberData.household_id)
      .eq("cycle_id", cycle.id)

    if (transactions) {
      transactions.forEach((tx) => {
        const amt = tx.amount

       if (tx.transaction_type === "top_up" || tx.transaction_type === "loan_return") {
        if (tx.payment_account === "cash") cashBalance += amt
        if (tx.payment_account === "card") cardBalance += amt
      } else if (tx.transaction_type === "expense" || tx.transaction_type === "settlement" || tx.transaction_type === "loan_out") {
        if (tx.payment_account === "cash") cashBalance -= amt
        if (tx.payment_account === "card") cardBalance -= amt
      } 
      // ⇄ Add your hybrid transfer logic here:
      else if (tx.transaction_type === "transfer") {
        if (tx.payment_account === "cash") cashBalance -= amt
        if (tx.payment_account === "card") cardBalance += amt
      }
      })
    }
  }

  // 6. Categories
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", memberData.household_id)
    .overrideTypes<Category[]>()

  if (categoriesError) {
    console.error("Failed to fetch categories:", categoriesError)
  } else {
    categories = categoriesData ?? []
  }

  // 7. Final return
  return {
    householdMember,
    monthlyCycle,
    categories,
    cash: cashBalance,
    card: cardBalance,
    total: cashBalance + cardBalance,
  }
}