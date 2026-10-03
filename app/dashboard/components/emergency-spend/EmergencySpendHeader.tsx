// app/dashboard/savings/emergency-spend/_components/EmergencySpendHeader.tsx
"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function EmergencySpendHeader() {
  return (
    <div className="flex items-start justify-between gap-3 pt-1 pb-1">
      <div>
        {/* Back Link to Parent Savings Page */}
        <Link
          href="/dashboard/savings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#2d3436] transition-colors mb-1 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Savings</span>
        </Link>

        {/* Page Title & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#2d3436] tracking-tight">
          Emergency Spend
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-tight">
          Track and manage unexpected household expenses.
        </p>
      </div>
    </div>
  )
}