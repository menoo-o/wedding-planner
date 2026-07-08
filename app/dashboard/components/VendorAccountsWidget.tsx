//app/dashboard/components/VendorAccountsWidget.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import CreateVendorModal from "./CreateVendorModal"

interface Vendor {
  id: string
  name: string
  default_category_id: string | null
  billing_cycle: string
}

interface Category {
  id: string
  name: string
}



interface VendorWithBalance extends Vendor {
  outstandingBalance: number
}

interface VendorTransaction {
  id: string
  amount: number
  description: string
  notes: string | null
  created_at: string
}

interface VendorAccountsProps {
  householdId: string
  currentCycleId: string
  createdBy: string
  cashBalance: number // 💳 Used for client-side settlement validation
  cardBalance: number
  categories: Category[] // 🥛 Add this line to the interface!
  vendors: any[] // your existing vendor type definition
}


export default function VendorAccountsWidget({
  householdId,
  currentCycleId,
 categories = [],
  createdBy,
  cashBalance,
  cardBalance,
}: VendorAccountsProps) {
  const supabase = createClient()
  const router = useRouter()

  const [vendors, setVendors] = useState<VendorWithBalance[]>([])
  const [selectedVendor, setSelectedVendor] = useState<VendorWithBalance | null>(null)
  const [pendingTxs, setPendingTxs] = useState<VendorTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  // Settlement interactive states
  const [paymentAccount, setPaymentAccount] = useState<"cash" | "card">("cash")
  const [isSettling, setIsSettling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionErrorSuccess] = useState<string | null>(null)

  const fetchVendorsAndBalances = useCallback(async () => {
    try {
      setLoading(true)
      
      // 1. Fetch all vendors linked to this household
      const { data: vendorData, error: vendorErr } = await supabase
        .from("vendors")
        .select("id, name, default_category_id, billing_cycle")
        .eq("household_id", householdId)
        .order("name", { ascending: true })

      if (vendorErr) throw vendorErr

      if (!vendorData || vendorData.length === 0) {
        setVendors([])
        setLoading(false)
        return
      }

      // 2. Fetch all outstanding pending_vendor transactions for these vendors
      const vendorIds = vendorData.map(v => v.id)
// 🥛 FIX 1: Look for payment_account = 'vendor' instead of paid_by = 'pending_vendor'
      const { data: txData, error: txErr } = await supabase
        .from("transactions")
        .select("amount, vendor_id")
        .eq("payment_account", "vendor")
        .is("parent_settlement_id", null)
        .in("vendor_id", vendorIds)

      if (txErr) throw txErr

      // 3. Compute balances on-the-fly to guarantee perfect mathematical synchrony
      const balanceMap: Record<string, number> = {}
      txData?.forEach(tx => {
        balanceMap[tx.vendor_id] = (balanceMap[tx.vendor_id] || 0) + Number(tx.amount || 0)
      })

      const vendorsWithBalances: VendorWithBalance[] = vendorData.map(v => ({
        ...v,
        outstandingBalance: balanceMap[v.id] || 0
      }))

      setVendors(vendorsWithBalances)
    } catch (err: any) {
      console.error("Error loading vendors:", err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, householdId])

  useEffect(() => {
    fetchVendorsAndBalances()
  }, [fetchVendorsAndBalances])

  const fetchVendorDetails = async (vendor: VendorWithBalance) => {
    try {
      setDetailsLoading(true)
      setSelectedVendor(vendor)
      setActionError(null)
      setActionErrorSuccess(null)

// 🥛 FIX 2: Look for payment_account = 'vendor' here too to grab itemized entries
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, description, notes, created_at")
        .eq("vendor_id", vendor.id)
        .eq("payment_account", "vendor")
        .is("parent_settlement_id", null)
        .order("created_at", { ascending: false })
      if (error) throw error

      setPendingTxs(data || [])
    } catch (err: any) {
      setActionError(`Failed to load statements: ${err.message}`)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleSettleAccount = async () => {
    if (!selectedVendor || selectedVendor.outstandingBalance <= 0) return
    
    setIsSettling(true)
    setActionError(null)

    const availableBalance = paymentAccount === "cash" ? cashBalance : cardBalance
    const totalDue = selectedVendor.outstandingBalance

    // Client-side guard verifying physical cash presence before settlement
    if (availableBalance < totalDue) {
      setActionError(`Insufficient funds in chosen account! Available: Rs. ${availableBalance.toLocaleString()}`)
      setIsSettling(false)
      return
    }

    try {
      const timestamp = new Date().toISOString()

      // A. Create the master settlement transaction deducting from the active cash/card pool
      const { data: settlementTx, error: settlementErr } = await supabase
        .from("transactions")
        .insert({
          household_id: householdId,
          cycle_id: currentCycleId,
          created_by: createdBy,
          transaction_type: "settlement",
          payment_account: paymentAccount,
          amount: totalDue,
          description: `Clear Account Balance - ${selectedVendor.name}`,
          notes: `Paid total accrued tab of Rs. ${totalDue.toLocaleString()} via ${paymentAccount.toUpperCase()}.`,
          created_at: timestamp,
          paid_by: "household", // Marked as paid immediately using real household pool assets
          vendor_id: selectedVendor.id,
        })
        .select("id")
        .single()

      if (settlementErr || !settlementTx) throw settlementErr

      // B. Stamp all unpaid entries to point to this settlement transaction ID
const { error: stampErr } = await supabase
        .from("transactions")
        .update({ parent_settlement_id: settlementTx.id })
        .eq("vendor_id", selectedVendor.id)
        .eq("payment_account", "vendor")
        .is("parent_settlement_id", null)

      // Fail-Safe: Manual rollback protection to prevent balance leaks
      if (stampErr) {
        await supabase.from("transactions").delete().eq("id", settlementTx.id)
        throw stampErr
      }

      setActionErrorSuccess(`Account with ${selectedVendor.name} settled successfully!`)
      setSelectedVendor(null)
      setPendingTxs([])
      
      // Refresh database records and propagate state updates
      await fetchVendorsAndBalances()
      router.refresh()
    } catch (err: any) {
      setActionError(`Settlement failed: ${err.message}`)
    } finally {
      setIsSettling(false)
    }
  }

  const grandTotalPending = vendors.reduce((acc, v) => acc + v.outstandingBalance, 0)

  if (loading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 w-1/3 bg-gray-150 rounded" />
        <div className="h-24 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Vendor Account Cards List (Occupies 1 column) */}
      <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-gray-900">Vendor Accounts 🥛</h2>
          <p className="text-xs text-gray-500">Track outstanding periodic tabs for local delivery services.</p>
        </div>

        {/* Aggregate Accrued Debts overview */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Total Outstanding Tabs</span>
          <span className="text-2xl font-black text-amber-800 font-mono block">
            Rs. {grandTotalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

   <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
  {vendors.length === 0 ? (
    <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30 flex flex-col items-center justify-center gap-2">
      <p className="text-xs text-gray-500 font-medium">
        No custom vendors created yet.
      </p>
      
      {/* 🥛 Dynamic inline placement for the registration trigger modal */}
      <CreateVendorModal 
        householdId={householdId} 
        categories={categories} 
      />
    </div>
  ) : (
    vendors.map((vendor) => (
      <button
        key={vendor.id}
        onClick={() => fetchVendorDetails(vendor)}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
          selectedVendor?.id === vendor.id
            ? "border-amber-500 bg-amber-50/20 shadow-sm"
            : "border-gray-100 hover:border-gray-200 bg-white"
        }`}
      >
        <div>
          <h4 className="text-sm font-bold text-gray-900">{vendor.name}</h4>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mt-0.5">
            {vendor.billing_cycle} cycle
          </span>
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold font-mono ${vendor.outstandingBalance > 0 ? "text-amber-600" : "text-gray-400"}`}>
            Rs. {vendor.outstandingBalance.toLocaleString()}
          </span>
        </div>
      </button>
    ))
  )}
</div>
      </div>

      {/* 2. Detailed Verification and Settlement Module (Occupies 2 columns) */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
        {!selectedVendor ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <span className="text-3xl">📝</span>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-800">Select a Vendor Account</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Verify daily deliveries and logs, check dates, and settle monthly accounts directly from household card or cash pools.
              </p>
            </div>
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                {actionSuccess}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">{selectedVendor.name} Details</h3>
                  <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedVendor.billing_cycle} Tab
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Cross-reference statements with daily entries below.</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            {/* Middle section: Transaction List and Payment Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[220px]">
              
              {/* Daily Delivery logs list */}
              <div className="space-y-2 flex flex-col">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Statement Deliveries</h4>
                
                {detailsLoading ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-400 animate-pulse">
                    Loading records...
                  </div>
                ) : pendingTxs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-400 border border-dashed rounded-lg p-4">
                    All deliveries are currently settled!
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[250px] space-y-1.5 pr-1 flex-1">
                    {pendingTxs.map((tx) => (
                      <div key={tx.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs flex justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-800">{tx.description}</p>
                          {tx.notes && <p className="text-[10px] text-gray-400 mt-0.5">{tx.notes}</p>}
                          <span className="text-[9px] text-gray-400 font-mono block mt-1">
                            {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <span className="font-bold text-gray-700 font-mono">
                          Rs. {tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settlement Panel */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Settlement Options</h4>
                  
                  {actionError && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-semibold">
                      ⚠️ {actionError}
                    </div>
                  )}

                  {/* Payment Account selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pay From Account *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentAccount("cash")}
                        className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-all ${
                          paymentAccount === "cash"
                            ? "border-amber-500 bg-amber-50/10 text-amber-700"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        💵 Cash Wallet
                        <span className="text-[9px] font-mono block text-gray-400 font-medium mt-0.5">
                          Bal: Rs. {cashBalance.toLocaleString()}
                        </span>
                      </button>

                      <button
                        onClick={() => setPaymentAccount("card")}
                        className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-all ${
                          paymentAccount === "card"
                            ? "border-amber-500 bg-amber-50/10 text-amber-700"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        💳 Bank Card
                        <span className="text-[9px] font-mono block text-gray-400 font-medium mt-0.5">
                          Bal: Rs. {cardBalance.toLocaleString()}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Final Bill Summary Block */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Total Settle Amount:</span>
                    <span className="font-bold font-mono text-gray-800 text-sm">
                      Rs. {selectedVendor.outstandingBalance.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleSettleAccount}
                    disabled={isSettling || selectedVendor.outstandingBalance <= 0}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    {isSettling ? "Settling Ledger..." : "Clear Outstanding Tab 🥛"}
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  )
}