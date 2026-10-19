// app/dashboard/_components/TransactionRowActions.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"

interface Props {
  isEditable: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function TransactionRowActions({ isEditable, onEdit, onDelete }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!isEditable) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={14} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              onEdit()
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#2d3436]"
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              onDelete()
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}