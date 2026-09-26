// app/dashboard/components/modals/ModalShell.tsx
"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ModalShellProps {
  title: string
  subtitle?: string
  onClose: () => void
  /** md = single-column forms (deposit, loan, transfer). xl = two-column (add expense, transfer w/ side rail). */
  size?: "md" | "xl"
  /** Optional icon badge shown left of the title, e.g. for TransferModal. */
  icon?: ReactNode
  children: ReactNode
}

/**
 * One shell for every dashboard modal: bottom sheet on mobile, centered dialog
 * from sm: up. Rendered through a portal so it always sits above the header and
 * the mobile bottom nav. Children should be a <form> using formShellCls /
 * formBodyCls / formFooterCls from formStyles.ts.
 */
export default function ModalShell({
  title,
  subtitle,
  onClose,
  size = "md",
  icon,
  children,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock page scroll behind the modal
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-[#2d3436]/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet / dialog */}
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto flex w-full max-h-[94dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_25px_80px_-20px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-8 duration-300 sm:max-h-[92dvh] sm:rounded-[2rem] sm:zoom-in-95 ${
            size === "xl" ? "sm:max-w-4xl" : "sm:max-w-md"
          }`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-50 px-5 py-4 sm:px-8 sm:py-6">
            <div className="flex min-w-0 items-center gap-3">
              {icon && (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#8b9dc3]/10 sm:h-11 sm:w-11">
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#2d3436] sm:text-xl">{title}</h2>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-gray-400 sm:mt-1 sm:text-sm">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {children}
        </div>
      </div>
    </>,
    document.body
  )
}