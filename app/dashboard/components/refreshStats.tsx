"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCw } from "lucide-react"

export default function RefreshButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      title="Refresh Data"
      className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-sm transition-all disabled:opacity-50"
    >
      <RotateCw
        size={18}
        strokeWidth={1.5}
        className={`transition-transform ${isPending ? "animate-spin text-[#2d3436]" : ""}`}
      />
    </button>
  )
}