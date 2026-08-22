// app/dashboard/components/Toast.tsx
"use client"

import React from "react"

// Update this line to include "warning"
export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message: string
}

interface ToastProps {
  toast: ToastData | null
  onDismiss: () => void
  duration?: number // ms, default 4000
}

const STYLES: Record<ToastType, string> = {
  success: "bg-white border-gray-100 text-[#00b894]",
  error: "bg-white border-red-100 text-[#e17055]",
  warning: "bg-white border-amber-100 text-[#fdcb6e]",
  info: "bg-white border-[#8b9dc3]/20 text-[#8b9dc3]",
}

const ICON_BG: Record<ToastType, string> = {
  success: "bg-[#e8f5e9] text-[#00b894]",
  error: "bg-[#ffebee] text-[#e17055]",
  warning: "bg-[#fff3e0] text-[#fdcb6e]",
  info: "bg-[#e8eaf6] text-[#8b9dc3]",
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  // 1. Guard against null to prevent runtime crash
  if (!toast) return null

  const duration =  3000

  return (
    <>
      {/* 2. Keyframes definition injected for the shrink animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      <div className="fixed top-5 right-5 z-[100] animate-in slide-in-from-right-4 fade-in duration-300 ease-out">
        <div
          className={`relative rounded-2xl border shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] p-4 pr-10 min-w-[340px] max-w-[420px] backdrop-blur-sm ${STYLES[toast.type]}`}
        >
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-current opacity-40"
              style={{
                animation: `shrink ${duration}ms linear forwards`,
              }}
            />
          </div>

          <div className="flex items-start gap-3.5">
            {/* Icon circle */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${ICON_BG[toast.type]}`}
            >
              <span className="text-base leading-none">{ICONS[toast.type]}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-semibold text-[13px] text-[#2d3436] leading-tight">
                {toast.title}
              </p>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              aria-label="Dismiss"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
// ── Hook for easy toast management ────────────────────────────

export function useToast() {
  const [toast, setToast] = React.useState<ToastData | null>(null)

  const show = React.useCallback((type: ToastType, title: string, message: string) => {
    setToast({ id: Math.random().toString(36).slice(2), type, title, message })
  }, [])

  const dismiss = React.useCallback(() => setToast(null), [])

  React.useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      setToast(null)
    }, 3000) // 👈 Stays visible for 3 seconds on screen

    return () => clearTimeout(timer)
  }, [toast])

  return { toast, show, dismiss }
}


