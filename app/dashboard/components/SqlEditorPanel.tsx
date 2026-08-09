'use client'
import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { executeSqlQuery } from '@/app/dashboard/_lib/sqlEditoor'

export default function SqlEditorPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('select * from transactions limit 20;')
  const [rows, setRows] = useState<Record<string, any>[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRun() {
    setLoading(true)
    setError(null)
    const result = await executeSqlQuery(query)
    setRows(result.rows)
    setError(result.error)
    setLoading(false)
  }

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div className="rounded-2xl bg-[--color-cream] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">SQL Query</h3>
        <button onClick={onClose} className="text-sm opacity-60">Close</button>
      </div>

      <CodeMirror
        value={query}
        height="140px"
        extensions={[sql()]}
        onChange={(val) => setQuery(val)}
      />

      <button
        onClick={handleRun}
        disabled={loading}
        className="mt-3 rounded-full px-4 py-2 bg-black text-white text-sm disabled:opacity-50"
      >
        {loading ? 'Running…' : 'Run query'}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {rows && !error && (
        <div className="mt-4 overflow-auto max-h-96 rounded-xl border border-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-medium bg-black/5">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-black/5">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2">{String(row[col] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}