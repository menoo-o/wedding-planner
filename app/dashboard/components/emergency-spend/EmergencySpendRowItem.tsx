// app/dashboard/savings/emergency-spend/_components/EmergencySpendRowItem.tsx
"use client"

import {
  GraduationCap,
  Scale,
  Cross,
  Wrench,
  HelpCircle,
  ChevronRight,
} from "lucide-react"
import type { EmergencySpendRow } from "@/app/dashboard/_db/emergencySpend"

interface RowProps {
  item: EmergencySpendRow
}

export default function EmergencySpendRowItem({ item }: RowProps) {
  // Category icon mapping matching design mockup
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
          icon: <Cross size={15} strokeWidth={2} />,
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
          bg: "bg-gray-100 text-gray-600",
        }
    }
  }

  const { icon, bg } = getCategoryIcon(item.category)

  return (
    <div className="flex items-center justify-between p-3.5 sm:px-6 sm:py-4 hover:bg-gray-50/50 transition-colors border-b border-gray-50/80 last:border-b-0 cursor-pointer group">
      {/* ── Left: Icon + Title & Payee ── */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 md:w-5/12">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-[#2d3436] truncate">
            {item.title}
          </p>
          <p className="text-[11px] text-gray-400 truncate capitalize">
            {item.category.replace("_", " ")} {item.payee_name && `• ${item.payee_name}`}
          </p>
        </div>
      </div>

      {/* ── Center: Date & Vault Notes ── */}
      <div className="hidden md:block md:w-4/12 text-left">
        <p className="text-xs font-medium text-gray-500">
          {new Date(item.created_at).toISOString().split("T")[0]}
        </p>
        <p className="text-[11px] text-gray-400 truncate">
          {item.notes || "Emergency Reserve"}
        </p>
      </div>

      {/* ── Right: Amount & Caret ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="text-xs sm:text-sm font-bold text-[#e17055] tabular-nums">
          -Rs {item.amount.toLocaleString()}
        </span>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </div>
  )
}