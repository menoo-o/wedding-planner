// app/expense/page.tsx

import ExpenseForm from "@/components/ExpenseForm/TransactionForm"
import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import { redirect } from "next/navigation"


// type HouseholdMember = {
//   household_id: string
//   role: "admin" | string
//   status: "active" | "inactive" | "pending" | string
// }


type CategorySummary = {
  id: string
  name: string
}


type HouseholdMember = {
  household_id: string
  role: "admin" | string
  status: "active" | "inactive" | "pending" | string
}

type MonthlyCycle = {
  id: string
  household_id?: string
  month?: number
  year?: number
  is_closed?: boolean
  opening_balance?: number
  closing_balance?: number
  created_at?: string
}

type Transaction = {
  id: string;

  household_id: string;
  cycle_id: string;
  created_by: string;

  transaction_type:
    | "expense"
    | "top_up"
    | "loan_out"
    | "loan_in"
    | "loan_return"
    | "settlement"
    | "refund"
    | "adjustment";

  category_id: string | null;

  // Person involved (Ali, etc)
  counterparty_name: string | null;

  amount: number;

  description: string;

  reimbursement_status:
    | "pending"
    | "settled"
    | null;

  created_at: string;

  // When obligation finished
  cleared_at: string | null;

  notes: string | null;

  payment_account:
    | "cash"
    | "card"
    | "personal"
    | null;

  // Links settlement / loan_return
  related_transaction_id: string | null;

  // Expense-only
  paid_by:
    | "household"
    | "other"
    | null;
};

// Catefory Table: [id, household_id, name]
type Category = {
  id: string
  household_id: string
  name: string
}



export default async function ExpenseEntry() {
  return (
    <div className="dashboard-container">
      {/* 
        Suspense enables streaming:
        - The page shell renders immediately
        - FetchDashboardData resolves separately
        - Skeleton is shown while waiting
      */}
      <Suspense fallback={<DashboardSkeleton />}>
        <ExpensePage />
      </Suspense>
    </div>
  )
}






async function ExpensePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()



  // If not authenticated → redirect (server-side)
   if (error || !data?.claims) {
     redirect("/login")
   }

   let householdMember: HouseholdMember | null = null
   let monthlyCycle: MonthlyCycle | null = null
   let categories: Category[] = []

  if (data?.claims?.sub) {
  // Fetch household membership for logged-in user
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", data.claims.sub)
    .eq("status", "active")
    .single<HouseholdMember>()

if (memberError || !memberData) {
  console.error("Failed to fetch household member:", memberError)

  return (
    <div>
      No active household membership found.
    </div>
  )
}

householdMember = memberData
  // Fetch monthly_cycles data 
 // Fetch monthly cycle
const { data: cycle, error: cycleError } = await supabase
  .from("monthly_cycles")
  .select("*")
  .eq("household_id", memberData?.household_id)
  .eq("is_closed", false)
  .single<MonthlyCycle>()

if (cycleError) {
  console.error("Failed to fetch monthly cycle:", cycleError)
} else {
  monthlyCycle = cycle
  // console.log("Current Monthly Cycle:", cycle)
 }


const { data: categoriesData, error: categoriesError } = await supabase
  .from("categories")
  .select("*")
  .eq("household_id", memberData?.household_id)
  .overrideTypes<Category[]>()

if (categoriesError) {
  console.error("Failed to fetch categories:", categoriesError)
} else {
  categories = categoriesData ?? []
}
  // console log data claims ,sub
  console.log("User Claims:", data?.claims)
  console.log("User ID (sub):", data?.claims?.sub)
}

  return (
    <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <ExpenseForm 
          categories={categories} // TypeScript is happy now!
          householdId={householdMember?.household_id || ""}
          currentCycleId={monthlyCycle?.id || ""}
          createdBy={data.claims.sub} // Pass user ID to form
         
        />
      </div>
    </div>
  )
}


function DashboardSkeleton() {
  return (
    <div className="dashboard-box">
      <p>Loading dashboard...</p>
    </div>
  )
}