// import { getActiveReceivables, readSupaTables } from "./queries";
import { Suspense } from "react";
import DashForm from "./components/ExpenseForm"
import TopUpForm from "./components/TopUpForm"
import AddCategoryForm from "./components/AddCategoryForm";
import LiquidityWidget from "./components/liquidity-widget";
import LoanForm from "./components/LoanForm" // Import your new unified loan engine
import AdvancedMetrics from "./components/AdvancedMetrics"
import ReceivablesList from "./components/ReceivablesList"
import RecentExpenses from "./components/ExpensesDashBlock/Activity" // Updated import path for the new RecentExpenses component
import Link from "next/link";
import { getLiveServerLiquidity } from "./components/liquidity-widget/liquidity" // Import the server-side liquidity fetcher
import { getDashboardData } from './_services/dashboard'
import ActivePayables from "@/app/dashboard/components/Payables" // Import the new ActivePayables component
import VendorAccountsWidget from "@/app/dashboard/components/VendorAccountsWidget" // Import the new VendorAccountsWidget component
import { getVendors } from "@/app/dashboard/_services/vendors"
import SavingsVaultWidget from "./components/SavingsVaultWidget"

export default async function Dashboard() {
  return (
    <div className="dashboard-container">
      <Suspense fallback={<DashboardSkeleton />}>
        <FetchDashboardData />
      </Suspense>
    </div>
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function FetchDashboardData() {
  const {
    householdMember, monthlyCycle, categories, receivables, payables,
    userId, netDebt, currentExpenses, previousExpenses, runway,
    debtLoadRatio, rawTransactions, walletName, savingsBalance,
    receivablesRecords, payablesRecords,
  } = await withTimeout(getDashboardData(), 8000, "getDashboardData")

  const householdId = householdMember?.household_id ?? ""
  const currentCycleId = monthlyCycle?.id ?? ""
  const createdBy = householdMember?.user_id ?? ""

  const [liveLiquidity, vendors] = await withTimeout(
    Promise.all([
      getLiveServerLiquidity(householdId),
      getVendors(householdId),
    ]),
    8000,
    "liveLiquidity/vendors"
  )

  const { cash, card, total } = liveLiquidity

  const rawExpenses = (rawTransactions || []).filter((tx) => tx.transaction_type === "expense")
  const expensesWithCategoryNames = rawExpenses.map((tx) => {
    const matchingCategory = categories.find((cat) => cat.id === tx.category_id)
    return { ...tx, category_name: matchingCategory ? matchingCategory.name : "General" }
  })

  return (
    <div className="dashboard-box">
      <h1 className="text-2xl font-semibold">Welcome to Your Dashboard</h1>

     <span>
      <Link href="/dashboard/debts" className="text-blue-500 underline">
        View Detailed Debts Page{"\u00A0"}
      </Link>
     </span>

      <DashForm 
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
        vendors={vendors}
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
      />

      {/* Top-Up Form */}
      <TopUpForm
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
      />

      {/* Loan Button Module Trigger Component */}
          <LoanForm 
            householdId={householdId}
            currentCycleId={currentCycleId}
            createdBy={createdBy}
            cashBalance={cash} // Directly binds overdraft validation logic
            cardBalance={card}
          />

      <AddCategoryForm householdId={householdId} />

  <ActivePayables
        records={payablesRecords}
        totalPayablesAmount={payables}
        cashBalance={cash}
        cardBalance={card}
        createdBy={createdBy}
      />

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


       {/* 🥛 New Vendor Accounts Settlement Workspace Dashboard Widget */}
      <div className="my-6">
    <VendorAccountsWidget
      householdId={householdId}
      currentCycleId={currentCycleId}
      createdBy={createdBy}
      cashBalance={cash}
      cardBalance={card}
      categories={categories}
      vendors={vendors}
    />
      </div>

       <RecentExpenses 
        transactions={expensesWithCategoryNames} 
        currentExpensesTotal={currentExpenses} // Directly feed the server calculated current cycle expenses total for display in the card header
      />



      <AdvancedMetrics 
        receivables={receivables}       // Active money owed to you right now
        payables={payables}             // Active money you owe out right now
        netDebt={netDebt}               // True net debt position (Receivables - Payables)
        currentExpenses={currentExpenses} // This month's total cumulative spending
        previousExpenses={previousExpenses} // Last month's baseline spend for comparison
        runway={runway}                 // Survival months remaining based on burn rate
        debtLoadRatio={debtLoadRatio}   // Financial stress % score (Payables / Liquidity)
      />


      



{currentCycleId ? (
        <LiquidityWidget
          householdId={householdId}
          currentCycleId={currentCycleId} // 🚀 Error fixed! Uses computed variable string
          createdBy={userId}               // 🚀 Error fixed! Uses destructured server userId
          cash={cash}
          card={card}
          total={total}                    // 🚀 Included to keep your compiler completely green!
          walletName={walletName}
          savingsBalance={savingsBalance}
        />
      ) : (
        <div className="p-4 text-center border border-dashed rounded-xl bg-gray-50 text-xs text-gray-400">
          No active financial ledger cycle found.
        </div>
      )}

<SavingsVaultWidget 
      householdId={householdId}
      walletName={walletName}
      savingsBalance={savingsBalance}
    />

       <ReceivablesList 
            records={receivablesRecords} 
            householdId={householdId}
            currentCycleId={currentCycleId}
            createdBy={createdBy}
          />
     



         
    {/* section: Liquidity */}
    {/* <section>
      <h2 className="text-lg font-medium">Liquidity</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Cash Balance:</span> PKR {cash.toFixed(1)}
        </p>
        <p>
          <span className="font-medium">Card Balance:</span> PKR {card.toFixed(1)}
        </p>
        <p>
          <span className="font-medium">Total Balance:</span> PKR {total.toFixed(1)}
        </p>
      </div>
    </section> */}
{/* 🚀 Feeding the server calculated states directly as props */}
      

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