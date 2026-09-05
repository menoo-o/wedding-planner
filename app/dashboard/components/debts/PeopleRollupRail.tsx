// app/dashboard/debts/_components/PeopleRollupRail.tsx
"use client"

import { ChevronRight } from "lucide-react"
import type { PersonRollupItem } from "@/app/dashboard/_db/debt"

interface PeopleRollupRailProps {
  people: PersonRollupItem[]
  selectedPerson: string | null
  onSelectPerson: (name: string) => void
}

export default function PeopleRollupRail({
  people,
  selectedPerson,
  onSelectPerson,
}: PeopleRollupRailProps) {
  if (people.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        People (Net Balance)
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {people.map((person) => {
          const isSelected = selectedPerson?.toLowerCase() === person.name.toLowerCase()
          const isReceivable = person.direction === "receivable"

          return (
            <button
              key={person.name}
              type="button"
              onClick={() => onSelectPerson(person.name)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left flex-shrink-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
                isSelected
                  ? "border-[#00b894] ring-2 ring-[#00b894]/20"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#f0f2f5] text-[#2d3436] font-semibold text-xs flex items-center justify-center flex-shrink-0">
                {person.initials}
              </div>

              <div>
                <p className="text-xs font-semibold text-[#2d3436] leading-tight">
                  {person.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {isReceivable ? "Net owes you" : "You owe"}
                </p>
                <p
                  className={`text-xs font-bold mt-0.5 ${
                    isReceivable ? "text-[#00b894]" : "text-[#e17055]"
                  }`}
                >
                  Rs {person.netBalance.toLocaleString()}
                </p>
              </div>
            </button>
          )
        })}

        <button
          type="button"
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all flex-shrink-0 shadow-sm"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}