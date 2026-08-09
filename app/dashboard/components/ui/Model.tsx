// app/dashboard/components/ui/Modal.tsx
"use client"

import { X } from "lucide-react"
import { ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[20px] max-w-[440px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="px-6 pt-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#2d3436]">{title}</h2>
            {subtitle && (
              <p className="text-[13px] text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[10px] border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all flex-shrink-0"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">{children}</div>
      </div>
    </div>
  )
}