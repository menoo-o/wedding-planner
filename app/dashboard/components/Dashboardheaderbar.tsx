// app/dashboard/components/DashboardHeaderBar.tsx

import { Bell } from "lucide-react"
import ActionBar from "@/app/dashboard/components/ui/ActionBar"
import RefreshButton from "@/app/dashboard/components/refreshStats"
import { getDashboardData } from "@/app/dashboard/_services/dashboard"
import { getLiveServerLiquidity } from "@/app/dashboard/components/liquidity-widget/liquidity"

export default async function DashboardHeaderBar() {
  const { householdMember, monthlyCycle, categories } = await getDashboardData()

  const householdId = householdMember?.household_id ?? ""
  const currentCycleId = monthlyCycle?.id ?? ""
  const createdBy = householdMember?.user_id ?? ""

  const { cash, card } = await getLiveServerLiquidity(householdId)

  return (
    <div className="fixed top-6 right-8 z-50 flex items-center gap-1.5 bg-white/95 rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] border border-gray-200/70 ring-1 ring-black/[0.02] p-1.5">
      <ActionBar
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
        cashBalance={cash}
        cardBalance={card}
        initialCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <div className="w-px h-6 bg-gray-200/70 mx-0.5" />

      <RefreshButton />

      <button
        type="button"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100/70 transition-all relative"
      >
        <Bell size={18} strokeWidth={1.5} />
      </button>

      <div className="w-9 h-9 rounded-xl bg-[#dfe6e9] flex items-center justify-center text-[#636e72] font-bold text-sm">
        U
      </div>
    </div>
  )
}