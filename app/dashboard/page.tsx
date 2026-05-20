import { redirect } from 'next/navigation'
// import { getDashboardSummary, logout } from './actions'
import { createClient } from '@/utils/supabase/server'

import { Suspense } from 'react'
import Link from 'next/link'

// ------------------
// --------------------------------
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
  const supabase = await createClient()
  // Validate user session via JWT claims
  const { data, error } = await supabase.auth.getClaims()

  // If not authenticated → redirect (server-side)
   if (error || !data?.claims) {
     redirect("/login")
   }
  // const summary = await getDashboardSummary();

  
  return (
    <>  
    <div className="text-on-surface">
      <nav className=" w-74 fixed left-0 top-0 border-r border-outline-variant/30 bg-surface flex flex-col py-8 px-4 h-full z-40 hidden md:flex">
      <div className="mb-8">
      <div className="flex items-center gap-3 px-4">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
      <span className="material-symbols-outlined text-on-primary text-xl" data-icon="token"  >token</span>
      </div>
      <div>
      <h2 className="text-xl font-bold text-on-surface tracking-tight"  >The Monolith</h2>
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold"  >Premium Finance</p>
      </div>
      </div>
      </div>
      <div className="flex-grow space-y-2">
      <a className="bg-surface-container-high text-on-surface rounded-xl font-bold flex items-center gap-4 px-4 py-3 transition-all active:scale-98" href="#"  >
      <span className="material-symbols-outlined" data-icon="dashboard"  >dashboard</span>
      <span className="font-plus-jakarta-sans text-sm font-medium"  >Dashboard</span>
      </a>
      <a className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-low hover:text-on-surface transition-all active:scale-98" href="#"  >
      <span className="material-symbols-outlined" data-icon="receipt_long"  >receipt_long</span>
      <span className="font-plus-jakarta-sans text-sm font-medium"  >Ledger</span>
      </a>
      <a className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-low hover:text-on-surface transition-all active:scale-98" href="#"  >
      <span className="material-symbols-outlined" data-icon="group"  >group</span>
      <span className="font-plus-jakarta-sans text-sm font-medium"  >Members</span>
      </a>
      <a className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-low hover:text-on-surface transition-all active:scale-98" href="#"  >
      <span className="material-symbols-outlined" data-icon="analytics"  >analytics</span>
      <span className="font-plus-jakarta-sans text-sm font-medium"  >Insights</span>
      </a>
      </div>
      <div className="mt-auto border-t border-outline-variant/20 pt-6 space-y-2">
      <button className="w-full bg-primary text-on-primary rounded-xl py-3 font-bold flex items-center justify-center gap-2 mb-6 active:scale-95 transition-transform"  >
      <span className="material-symbols-outlined" data-icon="add"  >add</span>
      <span className=""  >Add Entry</span>
      </button>
      <a className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-low hover:text-on-surface transition-all" href="#"  >
      <span className="material-symbols-outlined" data-icon="help_outline"  >help_outline</span>
      <span className="font-plus-jakarta-sans text-sm font-medium"  >Support</span>
      </a>
      <a className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-low hover:text-on-surface transition-all" href="#"  >
      <span className="material-symbols-outlined" data-icon="logout"  >logout</span>
      <span className="font-plus-jakarta-sans text-sm font-medium"  >Sign Out</span>
      </a>
      </div>
      </nav>

      <header className="fixed top-0 z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-8 h-20 w-full md:hidden border-b border-outline-variant/30">
      <h1 className="text-2xl font-black text-on-surface tracking-tighter"  >Ledger Pro</h1>
      <div className="flex items-center gap-4">
      <span className="material-symbols-outlined text-on-surface-variant" data-icon="notifications"  >notifications</span>
      <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden">
      <img alt="User profile" className="w-full h-full object-cover" data-alt="Close up portrait of a professional man with a friendly expression in a modern office setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArjmsRBzHB0oQBOls-d8oxwhCj_P4-Q1RwOV-VEqQkEnGkMp5HEIsKismYoEX5B78URo0jnl8bYFu3sCisWO933mEhFesNVrGXRoqmmdA-bMZIrWnmRisYnhe1XhL9spP7xjJVTa4hXKCd-SIC41HCJLrq0Axs5zKAyuWqFm6KdDpT7OdRSpDHwR9_MjW60vsswThcxHgzTO8AgBXR2BhTbRZ59w9zrj2lertMidj8IK4g4CNrTEjCYdbKEmjn_XHDZClT-jKfON4"  />
      </div>
      </div>
      </header>

      <main className="md:ml-74 min-h-screen pt-24 md:pt-12 px-6 md:px-12 pb-12">
    <section className="mb-12">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-on-surface-variant text-sm font-medium tracking-widest uppercase mb-2 block">
            Available Liquidity
          </span>

          <h2 className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-on-surface leading-none">
            {/* $ {summary.cashFund.toLocaleString()}  */}
            <span className="text-outline">.00</span>
          </h2>
        </div>
    </div>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

    <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-2xl relative overflow-hidden group ambient-shadow">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
    <span 
        className="material-symbols-outlined text-6xl text-on-surface"
        data-icon="trending_down" 
        // style overriding opsz 24 
        style={{ fontSize: '50px' }}
        >trending_down
    </span>
    </div>
    <div className="relative z-10">
    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4"  > Total Spending</p>
    <p className="text-4xl font-bold font-plus-jakarta-sans mb-2"  >$12,402.50</p>
    <div className="flex items-center gap-2 text-error">
    <span className="material-symbols-outlined text-sm!" data-icon="arrow_upward"  >arrow_upward</span>
    <span className="text-sm font-medium" >8.4% from last month</span>
    </div>
    </div>
    </div>
    <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-2xl relative group ambient-shadow">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
    <span 
        className="material-symbols-outlined text-6xl text-on-surface" 
        data-icon="schedule"  
        style={{ fontSize: '50px' }}
        >schedule</span>
    </div>
    <div className="relative z-10">
    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4"  >Pending Requests</p>
    <p className="text-4xl font-bold font-plus-jakarta-sans mb-2"  >14</p>
    <div className="flex items-center gap-2 text-primary">
    <span className="text-sm font-medium"  >Requires your approval</span>
    </div>
    </div>
    <div className="mt-6">
    <button className="text-xs font-bold text-on-surface bg-surface-container px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors"  >Review Queue</button>
    </div>
    </div>

    <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-2xl flex flex-col justify-between ambient-shadow">
    <div>
    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4"  >of $20,000 limit</p>
    <div className="flex items-end justify-between mb-4">
    <span className="text-2xl font-bold font-plus-jakarta-sans text-on-surface"  >68%</span>
    <span className="text-on-surface-variant text-xs"  >of $20,000 limit</span>
    </div>
    <div className="h-3 w-full bg-surface-container-low rounded-none overflow-hidden">
    <div className="h-full bg-primary" style={{ width: '68%' }}></div>
    </div>
    </div>
    <div className="flex gap-2 mt-6">
    <div className="flex-1 h-12 bg-surface-container-low rounded-md flex items-center justify-center border border-outline-variant/10 hover:bg-surface-container transition-colors cursor-pointer">
    <span className="material-symbols-outlined text-on-surface-variant" data-icon="query_stats"  >query_stats</span>
    </div>
    <div className="flex-1 h-12 bg-surface-container-low rounded-md flex items-center justify-center border border-outline-variant/10 hover:bg-surface-container transition-colors cursor-pointer">
    <span className="material-symbols-outlined text-on-surface-variant" data-icon="file_export"  >file_export</span>
    </div>
    </div>
    </div>
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">

    <div className="lg:col-span-2">
    <div className="flex items-center justify-between mb-8">
    <h3 className="text-2xl font-bold font-plus-jakarta-sans"  >Recent Activity</h3>
    <div className="flex gap-2">
    <span className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold"  >All</span>
    <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-container-highest cursor-pointer transition-colors"  >Expenses</span>
    <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-container-highest cursor-pointer transition-colors"  >Transfers</span>
    </div>
    </div>
    <div className="space-y-4">

    <div className="bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between p-6 rounded-xl hover:bg-surface-container-low transition-colors group ambient-shadow">
    <div className="flex items-center gap-6">
    <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center group-hover:bg-surface-container-highest transition-colors">
    <span className="material-symbols-outlined text-2xl text-on-surface" data-icon="shopping_bag"  >shopping_bag</span>
    </div>
    <div>
    <h4 className="font-bold text-on-surface text-lg"  >Apple Store, Inc.</h4>
    <p className="text-on-surface-variant text-sm"  >Oct 24, 2023 • Hardware Upgrade</p>
    </div>
    </div>
    <div className="text-right">
    <p className="text-xl font-bold font-plus-jakarta-sans text-on-surface"  >-$2,499.00</p>
    <span className="text-[10px] uppercase font-bold text-primary tracking-widest"  >Completed</span>
    </div>
    </div>

    <div className="bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between p-6 rounded-xl hover:bg-surface-container-low transition-colors group ambient-shadow">
    <div className="flex items-center gap-6">
    <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center group-hover:bg-surface-container-highest transition-colors">
    <span className="material-symbols-outlined text-2xl text-on-surface" data-icon="cloud"  >cloud</span>
    </div>
    <div>
    <h4 className="font-bold text-on-surface text-lg"  >Amazon Web Services</h4>
    <p className="text-on-surface-variant text-sm"  >Oct 22, 2023 • Infrastructure</p>
    </div>
    </div>
    <div className="text-right">
    <p className="text-xl font-bold font-plus-jakarta-sans text-on-surface"  >-$1,120.45</p>
    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest"  >Pending</span>
    </div>
    </div>

    <div className="bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between p-6 rounded-xl hover:bg-surface-container-low transition-colors group ambient-shadow">
    <div className="flex items-center gap-6">
    <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center group-hover:bg-surface-container-highest transition-colors">
    <span className="material-symbols-outlined text-2xl text-on-surface" data-icon="restaurant"  >restaurant</span>
    </div>
    <div>
    <h4 className="font-bold text-on-surface text-lg"  >The Glass House</h4>
    <p className="text-on-surface-variant text-sm"  >Oct 21, 2023 • Client Dinner</p>
    </div>
    </div>
    <div className="text-right">
    <p className="text-xl font-bold font-plus-jakarta-sans text-on-surface"  >-$442.10</p>
    <span className="text-[10px] uppercase font-bold text-primary tracking-widest"  >Completed</span>
    </div>
    </div>

    <div className="bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between p-6 rounded-xl hover:bg-surface-container-low transition-colors group ambient-shadow">
    <div className="flex items-center gap-6">
    <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center group-hover:bg-surface-container-highest transition-colors">
    <span className="material-symbols-outlined text-2xl text-on-surface" data-icon="account_balance_wallet"  >account_balance_wallet</span>
    </div>
    <div>
    <h4 className="font-bold text-on-surface text-lg"  >Internal Transfer</h4>
    <p className="text-on-surface-variant text-sm"  >Oct 20, 2023 • Vault Funding</p>
    </div>
    </div>
    <div className="text-right">
    <p className="text-xl font-bold font-plus-jakarta-sans text-on-surface"  >+$15,000.00</p>
    <span className="text-[10px] uppercase font-bold text-primary tracking-widest"  >Completed</span>
    </div>
    </div>
    </div>
    </div>

    <div className="space-y-6">
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 ambient-shadow">
    <h3 className="text-xl font-bold font-plus-jakarta-sans mb-6"  >Spending Analysis</h3>
    <div className="space-y-6">
    <div>
    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
    <span className=""  >Software</span>
    <span className=""  >45%</span>
    </div>
    <div className="h-2 w-full bg-surface-container overflow-hidden">
    <div className="h-full bg-primary" style={{ width: '45%' }}></div>
    </div>
    </div>
    <div>
    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
    <span className=""  >Marketing</span>
    <span className=""  >30%</span>
    </div>
    <div className="h-2 w-full bg-surface-container overflow-hidden">
    <div className="h-full bg-primary-dim" style={{ width: '30%' }}></div>
    </div>
    </div>
    <div>
    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
    <span className=""  >Operations</span>
    <span className=""  >25%</span>
    </div>
    <div className="h-2 w-full bg-surface-container overflow-hidden">
    <div className="h-full bg-outline" style={{ width: '25%' }}></div>
    </div>
    </div>
    </div>
    <div className="mt-12 p-6 recessed-well rounded-xl">
    <p className="text-sm italic text-on-surface-variant mb-4">Your subscription spending increased by 12% this week. Consider reviewing unused SaaS licenses.</p>
    <button className="text-xs font-bold text-primary underline underline-offset-4"  >Optimize Now</button>
    </div>
    </div>
    </div>
    </section>
   
       </main>  
   
     </div>
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
