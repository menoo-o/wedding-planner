"use client"
import React, { useState } from 'react'
//app/dashboard/components/expenses/Activity.tsx
// Updated interface matching your client-side requirements
interface ExpenseTransaction {
  id: string
  amount: number
  transaction_type: "top_up" | "expense" | "transfer" | "loan_in" | "loan_out" | "loan_return" | "settlement" | "refund" | "adjustment"
  
  // 🏆 THE FIX: Add "personal" right here to support third-party paid bills!
  payment_account: "cash" | "card" | "personal" 
  
  description: string 
  related_transaction_id: string | null
  category_id?: string | null
  category_name?: string 
  created_at?: string | null
  notes?: string | null 
  
  // Optional additions to prevent any future structural typing noise:
  loan_status?: "pending" | "partial" | "settled" | null
  reimbursement_status?: "pending" | "partial" | "settled" | null
}





interface RecentExpensesProps {
  transactions: ExpenseTransaction[]
  currentExpensesTotal: number
}

export default function RecentExpenses({ transactions = [], currentExpensesTotal }: RecentExpensesProps) {
  // Mobile active state to track which row has been expanded on tap
  const [activeMobileId, setActiveMobileId] = useState<string | null>(null)
  
  const recentActivity = transactions.slice(0, 4)

  const toggleMobileDetails = (id: string) => {
    setActiveMobileId(activeMobileId === id ? null : id)
  }

  
  return (
    <div className="recent-expenses-container" style={{
      background: '#fff',
      border: '1px solid #e4e4e7',
      borderRadius: '12px',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* ── HEADER BLOCK ────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f4f4f5',
        paddingBottom: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#18181b', fontWeight: 600 }}>Recent Expenses</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#71717a' }}>
            Total Cycle Outflow: <strong style={{ color: '#18181b' }}>Rs. {currentExpensesTotal.toLocaleString()}</strong>
          </p>
        </div>
        <a href="/dashboard/expense" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
          See more &rarr;
        </a>
      </div>

      {/* ── TRANSACTION LIST ────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recentActivity.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '14px', padding: '16px 0' }}>
            No expenses logged this month.
          </p>
        ) : (
          recentActivity.map((tx) => (
            <div key={tx.id} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Core Item Row */}
              <div 
                onClick={() => toggleMobileDetails(tx.id)} // Expands detailed notes panel on mobile tap
                className="expense-row-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {/* Left Side Grouping */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Ledger Label Metadata */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#18181b' }}>
                        {tx.description}
                      </p>
                      
                      {/* Desktop Hover Tooltip Element */}
                      {tx.notes && (
                        <div className="tooltip-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                          <span style={{
                            cursor: 'help',
                            fontSize: '11px',
                            background: '#f4f4f5',
                            color: '#71717a',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}>?</span>
                          <div className="tooltip-bubble" style={{
                            visibility: 'hidden',
                            width: '200px',
                            background: '#18181b',
                            color: '#fff',
                            textAlign: 'center',
                            borderRadius: '6px',
                            padding: '8px',
                            position: 'absolute',
                            zIndex: 10,
                            bottom: '125%',
                            left: '50%',
                            marginLeft: '-100px',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            fontSize: '12px',
                            lineHeight: '1.4'
                          }}>
                            {tx.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category Label */}
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                      <span style={{ 
                        background: '#e0f2fe', 
                        color: '#0369a1', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 500,
                        marginRight: '6px'
                      }}>
                        {tx.category_name}
                      </span>
                      via {tx.payment_account}
                    </p>
                  </div>
                </div>

                {/* Right Side Pricing Profile */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>
                    -Rs. {tx.amount.toLocaleString()}
                  </p>
                  {tx.created_at && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a1a1aa' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Expandable Panel: Shows notes on mobile/tablet devices when item is tapped */}
              {tx.notes && activeMobileId === tx.id && (
                <div className="mobile-notes-panel" style={{
                  background: '#fafafa',
                  borderLeft: '3px solid #2563eb',
                  padding: '10px 14px',
                  margin: '2px 10px 8px 10px',
                  borderRadius: '0 4px 4px 0',
                  fontSize: '13px',
                  color: '#4b5563'
                }}>
                  <strong>Note:</strong> {tx.notes}
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* ── INJECT HOVER STYLE HOOKS VIA INLINE CSS ────────────────── */}
      <style>{`
        .expense-row-item:hover {
          background: #fafafa;
        }
        .tooltip-wrapper:hover .tooltip-bubble {
          visibility: visible !important;
          opacity: 1 !important;
        }
        @media (min-width: 769px) {
          .mobile-notes-panel {
            display: none !important; /* Conceals collapsible row block entirely on desktop devices */
          }
        }
      `}</style>
    </div>
  )
}