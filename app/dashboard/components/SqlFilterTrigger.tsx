'use client'
import { useState } from 'react'
import { Filter } from 'lucide-react'
import SqlEditorPanel from './SqlEditorPanel'

export default function SqlFilterTrigger() {
  const [showSqlEditor, setShowSqlEditor] = useState(false)

  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
        onClick={() => setShowSqlEditor((prev) => !prev)}
      >
        <Filter size={14} strokeWidth={1.5} />
        Filter
      </button>

      {showSqlEditor && (
        <SqlEditorPanel onClose={() => setShowSqlEditor(false)} />
      )}
    </>
  )
}