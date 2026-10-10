"use client"

import { useEffect } from "react"
import { useToastStore } from "@/store/Usetoaststore"

export default function NetworkToast() {
  const { message, type, isVisible, hideToast } = useToastStore()

  // "Back online" fades away on its own; "offline" stays until the
  // connection returns or the user dismisses it.
  useEffect(() => {
    if (!isVisible || type !== "online") return
    const t = setTimeout(hideToast, 3500)
    return () => clearTimeout(t)
  }, [isVisible, type, hideToast])

  // If we recover, drop any lingering offline toast immediately.
  if (!isVisible) return null

  const isOnline = type === "online"

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg
        top-[max(1rem,env(safe-area-inset-top))]
        ${isOnline ? "bg-[#e8f5e9] text-[#00b894]" : "bg-[#2d3436] text-white"}`}
    >
      <span>{isOnline ? "🟢" : "🔴"} {message}</span>
      <button
        onClick={hideToast}
        aria-label="Dismiss"
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        &times;
      </button>
    </div>
  )
}