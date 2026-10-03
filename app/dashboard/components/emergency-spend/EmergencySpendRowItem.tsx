// app/dashboard/savings/emergency-spend/_components/EmergencySpendRowItem.tsx
"use client"

import {
  GraduationCap,
  Scale,
  HeartPulse,
  Wrench,
  HelpCircle,
  ChevronRight,
  Clock,
} from "lucide-react"
import type { EmergencySpendRow } from "@/app/dashboard/_db/emergencySpend"

interface RowProps {
  item: EmergencySpendRow
}

export default function EmergencySpendRowItem({ item }: RowProps) {
  const isPlanned = item.status === "planned"

  // 1. Extract custom tag from notes if category is 'other' (e.g. "[wedding] Banquet hall deposit")
  const customTagMatch = item.notes?.match(/^\[([a-zA-Z]+)\]/)
  const customTag = customTagMatch ? customTagMatch[1] : null
  
  const displayCategory = customTag 
    ? customTag 
    : item.category.replace("_", " ")

  // Clean note string for display without the bracketed tag
  const cleanedNotes = customTagMatch
    ? item.notes?.replace(/^\[[a-zA-Z]+\]\s*/, "") || null
    : item.notes

  // 2. Icon & theme styling
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "education":
        return {
          icon: <GraduationCap size={15} strokeWidth={2} />,
          bg: "bg-blue-50 text-blue-500",
        }
      case "legal":
        return {
          icon: <Scale size={15} strokeWidth={2} />,
          bg: "bg-purple-50 text-purple-500",
        }
      case "medical":
        return {
          icon: <HeartPulse size={15} strokeWidth={2} />,
          bg: "bg-rose-50 text-rose-500",
        }
      case "home_repair":
        return {
          icon: <Wrench size={15} strokeWidth={2} />,
          bg: "bg-cyan-50 text-cyan-600",
        }
      default:
        return {
          icon: <HelpCircle size={15} strokeWidth={2} />,
          bg: "bg-amber-50 text-amber-600",
        }
    }
  }

  const { icon, bg } = getCategoryIcon(item.category)

  // 3. Date display (due_date for planned commitments; created_at/paid_at for settled items)
  const displayDate = isPlanned && item.due_date
    ? `Due: ${item.due_date}`
    : new Date(item.created_at).toISOString().split("T")[0]

  return (
    <div className="flex items-center justify-between p-3.5 sm:px-6 sm:py-4 hover:bg-gray-50/50 transition-colors border-b border-gray-50/80 last:border-b-0 cursor-pointer group">
      
      {/* ── Left: Icon + Title, Category Badge, Payee ── */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 md:w-5/12">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-semibold text-[#2d3436] truncate">
              {item.title}
            </p>
            {isPlanned && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-[10px] font-bold text-amber-700 shrink-0">
                <Clock size={10} />
                Planned
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 truncate capitalize">
            {displayCategory} {item.payee_name && `• ${item.payee_name}`}
          </p>
        </div>
      </div>

      {/* ── Center: Date & Vault Notes / Balance Snapshot ── */}
      <div className="hidden md:block md:w-4/12 text-left">
        <p className="text-xs font-medium text-gray-500">
          {displayDate}
        </p>
        <p className="text-[11px] text-gray-400 truncate">
          {cleanedNotes 
            ? cleanedNotes 
            : !isPlanned && item.vault_balance_after !== undefined
              ? `Vault rem: Rs ${item.vault_balance_after.toLocaleString()}`
              : "Emergency Reserve"}
        </p>
      </div>

      {/* ── Right: Amount & Caret ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span
          className={`text-xs sm:text-sm font-bold tabular-nums ${
            isPlanned ? "text-gray-500" : "text-[#e17055]"
          }`}
        >
          {isPlanned ? "" : "-"}Rs {item.amount.toLocaleString()}
        </span>
        <ChevronRight
          size={14}
          className="text-gray-300 group-hover:text-gray-500 transition-colors"
        />
      </div>
    </div>
  )
}