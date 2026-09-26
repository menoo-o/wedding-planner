// app/dashboard/components/DashboardHeaderBar.tsx

// import { Bell } from "lucide-react"
import ActionBar from "@/app/dashboard/components/ui/ActionBar"
import RefreshButton from "@/app/dashboard/components/refreshStats"
import { getDashboardData } from "@/app/dashboard/_services/dashboard"
// import { getLiveServerLiquidity } from "@/app/dashboard/components/liquidity-widget/liquidity"
import BrandLogo from "@/app/dashboard/components/BrandLogo"

export default async function DashboardHeaderBar() {
  const { 
    householdMember, 
    monthlyCycle, 
    categories,
    liveCash: cash, 
    liveCard: card, 
  } = await getDashboardData()

  const householdId = householdMember?.household_id ?? ""
  const currentCycleId = monthlyCycle?.id ?? ""
  const createdBy = householdMember?.user_id ?? ""

  // const { cash, card } = await getLiveServerLiquidity(householdId)
//app/dashboard/components/DashboardHeaderBar.tsx
  return (
   <header
    className="
       relative z-30 flex items-center px-4 sm:px-6 pt-4 pb-3
       lg:fixed lg:top-6 lg:right-8 lg:z-50 lg:gap-1.5 lg:p-1.5
      lg:bg-white/95 lg:rounded-2xl
      lg:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]
      lg:border lg:border-gray-200/70 lg:ring-1 lg:ring-black/[0.02]
    "
  >
    {/* Mobile only: brand on the left (pushes bell + avatar to the right) */}
    <BrandLogo className="mr-auto lg:hidden" />

    {/* Mobile: floats on the title row, right side, so the left stays free.
        Desktop: back to being the first item inside the pill. */}
    <div className="absolute right-4 sm:right-6 top-full mt-1 z-40 lg:static lg:mt-0">
      <ActionBar
        householdId={householdId}
        currentCycleId={currentCycleId}
        createdBy={createdBy}
        cashBalance={cash}
        cardBalance={card}
        initialCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>

  <div className="hidden lg:block w-px h-6 bg-gray-200/70 mx-0.5" />

    <RefreshButton />
{/* 
    <button
      type="button"
      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100/70 transition-all relative"
    >
      <Bell size={18} strokeWidth={1.5} />
    </button> */}

    <div className="w-9 h-9 rounded-xl bg-[#dfe6e9] flex items-center justify-center text-[#636e72] font-bold text-sm">
      U
    </div>
  </header>
  )
}