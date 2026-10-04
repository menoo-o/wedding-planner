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
import type { LucideIcon } from "lucide-react"

interface RowProps {
  item: EmergencySpendRow
}


const CATEGORY_STYLES: Record<string, { Icon: LucideIcon; tone: string }> = {
  education: { Icon: GraduationCap, tone: "bg-blue-50 text-blue-600" },
  legal: { Icon: Scale, tone: "bg-purple-50 text-purple-600" },
  medical: { Icon: HeartPulse, tone: "bg-rose-50 text-rose-600" },
  home_repair: { Icon: Wrench, tone: "bg-cyan-50 text-cyan-700" },
}
const FALLBACK_STYLE = { Icon: HelpCircle, tone: "bg-amber-50 text-amber-600" }

export default function EmergencySpendRowItem({ item }: RowProps) {
  const isPlanned = item.status === "planned"

  // Custom tag from notes, e.g. "[wedding] Banquet hall deposit"
  const customTagMatch = item.notes?.match(/^\[([^\]]+)\]/)
  const customTag = customTagMatch ? customTagMatch[1] : null

  const displayCategory = customTag ?? item.category.replace(/_/g, " ")

  const cleanedNotes = customTagMatch
    ? item.notes?.replace(/^\[[^\]]+\]\s*/, "") || null
    : item.notes

  const { Icon, tone } = CATEGORY_STYLES[item.category] ?? FALLBACK_STYLE

  const displayDate =
    isPlanned && item.due_date
      ? `Due: ${item.due_date}`
      : new Date(item.created_at).toISOString().split("T")[0]

  return (
    <div className="group flex cursor-pointer items-center justify-between gap-4 border-b border-gray-100 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-gray-50/60 sm:px-6 sm:py-4">
      {/* ── Left: icon + title, category, payee ── */}
      <div className="flex min-w-0 flex-1 items-center gap-3 md:w-5/12 md:flex-none">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#2d3436]">{item.title}</p>
            {isPlanned && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-amber-700">
                <Clock size={10} strokeWidth={2} />
                Planned
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs capitalize text-gray-500">
            {displayCategory}
            {item.payee_name && ` • ${item.payee_name}`}
          </p>
        </div>
      </div>

      {/* ── Center (md+): date + vault note ── */}
      <div className="hidden min-w-0 text-left md:block md:w-4/12">
        <p className="text-xs font-medium tabular-nums text-gray-600">{displayDate}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {cleanedNotes
            ? cleanedNotes
            : !isPlanned && item.vault_balance_after !== undefined
              ? `Vault rem: Rs ${item.vault_balance_after.toLocaleString()}`
              : "Emergency Reserve"}
        </p>
      </div>

      {/* ── Right: amount (+ date on mobile) and caret ── */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-right">
          <p
            className={`text-sm font-semibold tabular-nums ${
              isPlanned ? "text-gray-600" : "text-[#c2492f]"
            }`}
          >
            {isPlanned ? "" : "-"}Rs {item.amount.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-gray-500 md:hidden">{displayDate}</p>
        </div>
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          className="text-gray-300 transition-colors group-hover:text-gray-500"
        />
      </div>
    </div>
  )
}