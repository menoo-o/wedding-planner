"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createVendor } from "../_services/vendors"

interface Category {
  id: string
  name: string
}

interface CreateVendorModalProps {
  householdId: string
  categories: Category[]
}

export default function CreateVendorModal({ householdId, categories }: CreateVendorModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [defaultCategoryId, setDefaultCategoryId] = useState("")
  const [billingCycle, setBillingCycle] = useState("monthly")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createVendor({
        household_id: householdId,
        name: name.trim(),
        default_category_id: defaultCategoryId || null,
        billing_cycle: billingCycle,
      })

      // Reset state and close modal
      setName("")
      setDefaultCategoryId("")
      setBillingCycle("monthly")
      setIsOpen(false)
      
      // Instantly refresh server components to show the new vendor across all lists!
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create vendor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Trigger Button replacing the plain text state */}
      <button
        onClick={() => setIsOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
      >
        ➕ Add Your First Vendor Account
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">New Vendor Account</h3>
              <p className="text-xs text-gray-500">Register a local supplier to manage their tab locally.</p>
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
                ⚠️ {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vendor Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 uppercase">Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Everyday Milkman, Express Laundry"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 p-2 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Billing Cycle */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 uppercase">Billing Cycle</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="monthly">Monthly Settlement</option>
                  <option value="weekly">Weekly Settlement</option>
                  <option value="on_demand">On-Demand / Prepaid</option>
                </select>
              </div>

              {/* Default Category Connection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 uppercase">Default Expense Category</label>
                <select
                  value={defaultCategoryId}
                  onChange={(e) => setDefaultCategoryId(e.target.value)}
                  className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">-- None (Select Manually) --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400">Picking a default auto-fills the category during daily logs!</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-3 py-2 border border-gray-200 text-gray-700 font-semibold rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}