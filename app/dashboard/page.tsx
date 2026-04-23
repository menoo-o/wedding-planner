// import { redirect } from 'next/navigation'
import { getDashboardSummary, logout } from './actions'
// import { createClient } from '@/utils/supabase/server'
import './private.css'
import { Suspense } from 'react'
import Link from 'next/link'

// --------------------------------------------------
// Dashboard Page (Server Component)
// --------------------------------------------------
// - Statically rendered shell
// - Suspense boundary allows streaming
// - Only the inner data component becomes dynamic
// --------------------------------------------------

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
  // const supabase = await createClient()
  // Validate user session via JWT claims
  // const { data, error } = await supabase.auth.getClaims()

  // // If not authenticated → redirect (server-side)
  //  if (error || !data?.claims) {
  //    redirect("/login")
  //  }
  const summary = await getDashboardSummary();

  
  return (
   <main className="dashboard-page">

      <section className="dashboard-grid">
        {/* Available Liquidity */}
        <div className="available-liquidity">
          <p>Available Liquidity</p>
          <h2>Rs. {summary.cashFund.toLocaleString()}</h2>
        </div>

        {/* Total Spend */}
        <div className="total-spend">
          <p>Total Spend</p>
          <h2>Rs {summary.totalSpend.toLocaleString()}</h2>
        </div>

        {/* Net Position */}
        <div className="net-position">
          <p>Net Position</p>
          <h2>Rs. {summary.netPosition.toLocaleString()}</h2>
        </div>
        
        {/* Recent Activity */}
        <div className="activity-container">
  <div className="activity-header">
    <h3 className="activity-title">Recent Activity</h3>
    <Link href="/dashboard/expenses" className="view-all-link">
     View All
   </Link>
  </div>

  <div className="activity-list">
    {summary.recentTransactions.map((tx) => (
      <div key={tx.id} className="activity-item">
        <div className="activity-info">
          <p className="activity-description">{tx.description}</p>
          <p className="activity-date">
            {new Date(tx.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="activity-amount">
          -${Number(tx.amount).toFixed(2)}
        </div>
      </div>
    ))}
  </div>
</div>


      </section>

{/* logout */}
         <form action={logout}>
        <button type="submit" className="btn-logout">
          Logout User ID: {summary.user}
        </button>
      </form>
      
    </main>
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
