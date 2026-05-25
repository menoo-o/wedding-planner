import { redirect } from 'next/navigation'
// import { getDashboardSummary, logout } from './actions'
import { createClient } from '@/utils/supabase/server'

import { Suspense } from 'react'
// import Link from 'next/link'

// ------------------
// --------------------------------
// Dashboard Page (Server Component)
// --------------------------------------------------
// - Statically rendered shell
// - Suspense boundary allows streaming
// - Only the inner data component becomes dynamic
// --------------------------------------------------


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

export default async function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* 
        Suspense enables streaming:
        - The page shell renders immediately
        - FetchDashboardData resolves separately
        - Skeleton is shown while waiting
      */}
      <Suspense fallback={<DashboardSkeleton />}>
        <FetchDashboardData />
      </Suspense>
    </div>
  )
}

// --------------------------------------------------
// Data + Auth Layer (Async Server Component)
// --------------------------------------------------
// - Runs only on the server
// - Handles Supabase session validation
// - Redirects before rendering if not authenticated
// --------------------------------------------------

async function FetchDashboardData() {
  const supabase = await createClient()
  // Validate user session via JWT claims
  const { data, error } = await supabase.auth.getClaims()

  // If not authenticated → redirect (server-side)
   if (error || !data?.claims) {
     redirect("/login")
   }

   let householdMember: HouseholdMember | null = null
   let monthlyCycle: MonthlyCycle | null = null
   let transactions: Transaction[] = []
   let categories: Category[] = []

  if (data?.claims?.sub) {
  // Fetch household membership for logged-in user
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", data.claims.sub)
    .eq("status", "active")
    .single<HouseholdMember>()

  if (memberError) {
    console.error("Failed to fetch household member:", memberError)
  } else {
    householdMember = memberData
  }

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
  console.log("Current Monthly Cycle:", cycle)
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


///////////////////////////////////////////////
// Fetch data from transactions table (for current cycle)
const { data: transactionsData, error: transactionsError } =
  await supabase
    .from("transactions")
    .select(`
      id,
      household_id,
      cycle_id,
      created_by,
      transaction_type,
      category_id,
      counterparty_name,
      amount,
      description,
      reimbursement_status,
      created_at,
      cleared_at,
      notes,
      payment_account,
      related_transaction_id,
      paid_by
    `)
    .eq("cycle_id", cycle?.id)
    .eq("transaction_type", "expense") // <--- HERE IS YOUR FILTER
    .order("created_at", { ascending: false }) // newest first
    .overrideTypes<Transaction[]>()


  if (transactionsError) {
  console.error("Failed to fetch transactions:", transactionsError)
} else {
  transactions = transactionsData ?? []
}

//define type TS for category
// Category Table: [id, household_id, name]


}

return (
    <>  
      {/* Household Information */}
     <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome to Your Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            User ID: {data?.claims?.sub}
          </p>
        </div>

        {householdMember ? (
          <div className="rounded-lg border p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">
              Household Information
            </h2>

            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Household ID:</span>{" "}
                {householdMember.household_id}
              </p>

              <p>
                <span className="font-medium">Role:</span>{" "}
                {householdMember.role}
              </p>

              <p>
                <span className="font-medium">Status:</span>{" "}
                {householdMember.status}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No active household membership found.
          </p>
        )}
      </section>

    {/* monthly cycle data */}
    <section>
      {monthlyCycle ? (
        <div className="rounded-lg border p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">
            Current Monthly Cycle
          </h2>

          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Month:</span>{" "}
              {monthlyCycle.month}
            </p>

            <p>
              <span className="font-medium">Year:</span>{" "}
              {monthlyCycle.year}
            </p>

            <p>
              <span className="font-medium">Opening Balance:</span>{" "}
              {monthlyCycle.opening_balance}
            </p>

            <p>
              <span className="font-medium">Closing Balance:</span>{" "}
              {monthlyCycle.closing_balance}
            </p>

            <p>
              <span className="font-medium">Status:</span>{" "}
              {monthlyCycle.is_closed ? "Closed" : "Open"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No active monthly cycle found.
        </p>
      )}
    </section>

    {/* cateogory */}
    <section className="space-y-4">
  <div>
    <h2 className="text-lg font-semibold">Categories</h2>
    <p className="text-sm text-gray-500">
      Household expense categories
    </p>
  </div>

  {categories.length > 0 ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="rounded-lg border p-3 shadow-sm transition hover:shadow-md"
        >
          <p className="font-medium">{category.name}</p>

          <p className="text-xs text-gray-400">
            ID: {category.id}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-gray-500">
      No categories found for this household.
    </p>
  )}
</section>

{/* transactions */}

<section className="space-y-4">
  <div>
    <h2 className="text-xl font-semibold">
      Recent Transactions
    </h2>

    <p className="text-sm text-gray-500">
      Latest activity for the current monthly cycle
    </p>
  </div>

  {transactions.length > 0 ? (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="rounded-xl border p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left Side */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold capitalize">
                  {transaction.transaction_type.replace("_", " ")}
                </p>

                {transaction.reimbursement_status && (
                  <span className="rounded-full border px-2 py-0.5 text-xs">
                    {transaction.reimbursement_status}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700">
                {transaction.description}
              </p>

              {transaction.counterparty_name && (
                <p className="text-sm text-gray-500">
                  With: {transaction.counterparty_name}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1 text-xs text-gray-500">
                {transaction.payment_account && (
                  <span>
                    Account: {transaction.payment_account}
                  </span>
                )}

                {transaction.paid_by && (
                  <span>
                    Paid By: {transaction.paid_by}
                  </span>
                )}

                {transaction.cleared_at && (
                  <span>
                    Cleared:{" "}
                    {new Date(
                      transaction.cleared_at
                    ).toLocaleDateString()}
                  </span>
                )}
              </div>

              {transaction.notes && (
                <p className="pt-2 text-sm italic text-gray-500">
                  Note: {transaction.notes}
                </p>
              )}
            </div>

            {/* Right Side */}
            <div className="text-right">
              <p className="text-lg font-bold">
                Rs. {transaction.amount.toLocaleString()}
              </p>

              <p className="text-xs text-gray-500">
                {new Date(
                  transaction.created_at
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm text-gray-500">
        No transactions found for this cycle.
      </p>
    </div>
  )}
</section>
 


    </> 
  )
}

// --------------------------------------------------
// Loading Skeleton
// --------------------------------------------------
// - Rendered while FetchDashboardData resolves
// - Should visually match dashboard layout
// --------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="dashboard-box">
      <p>Loading dashboard...</p>
    </div>
  )
}


 {/* 
        Server Action form:
        - No client JS required
        - logout() runs securely on the server
      */}

      {/* <form action={logout}>
        <button type="submit" className="btn-logout">
          Logout User ID: {data.claims.sub}
        </button>
      </form> */}
