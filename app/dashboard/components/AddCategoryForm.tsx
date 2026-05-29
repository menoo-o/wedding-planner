// app/dashboard/components/AddCategoryForm.tsx
"use client"
"use no memo" // Silences the React Compiler watch warning safely

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type CategoryFormData = {
  household_id: string
  name: string
}

interface AddCategoryFormProps {
  householdId: string
}

export default function AddCategoryForm({ householdId }: AddCategoryFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    defaultValues: {
      household_id: householdId,
      name: "",
    },
  })

  // Keeps the hidden form state aligned if the server component changes households
  useEffect(() => {
    reset((prevValues) => ({
      ...prevValues,
      household_id: householdId,
    }))
  }, [householdId, reset])

  async function onSubmit(data: CategoryFormData) {
    if (!data.household_id || !data.name.trim()) {
      console.error("Submission Blocked: Missing household context or name string.")
      return
    }

    const cleanPayload = {
      household_id: data.household_id,
      name: data.name.trim(),
    }

    const { error } = await supabase
      .from("categories")
      .insert(cleanPayload)

    if (error) {
      console.error("Supabase Category Insert Error:", error.message)
      return
    }

    // Clear the text input but retain the structural household configuration
    reset({
      household_id: householdId,
      name: "",
    })

    setIsOpen(false)
    router.refresh() // Instantly re-runs server queries to populate all transaction dropdowns
  }

  return (
    <>
      {/* Clean Gray Utility CTA */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors shadow-sm"
      >
        + New Category
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Add New Category</h2>
                <p className="text-xs text-gray-500">Creates a custom tracking label for your household expenses.</p>
              </div>

              {/* Hidden Structural Binder */}
              <input type="hidden" {...register("household_id")} />

              {/* Category Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Subscriptions, Utilities, Pets"
                  {...register("name", {
                    required: "Category name is required",
                    maxLength: { value: 30, message: "Name must be under 30 characters" },
                  })}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors text-xs shadow-sm"
                >
                  {isSubmitting ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}