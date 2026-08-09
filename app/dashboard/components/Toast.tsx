// app/dashboard/components/Toast.tsx
"use client"

import React, { useEffect } from "react"

export type ToastType = "success" | "error" | "info"

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

const ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
}

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
}

export default function Toast({ toast, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [toast, onDismiss, duration])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className={`rounded-lg border shadow-lg p-4 min-w-[320px] max-w-[400px] ${STYLES[toast.type]}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5">{ICONS[toast.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{toast.title}</p>
            <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hook for easy toast management ────────────────────────────

export function useToast() {
  const [toast, setToast] = React.useState<ToastData | null>(null)

  const show = React.useCallback((type: ToastType, title: string, message: string) => {
    setToast({ id: Math.random().toString(36).slice(2), type, title, message })
  }, [])

  const dismiss = React.useCallback(() => setToast(null), [])

  return { toast, show, dismiss }
}