// app/dashboard/feedback/page.tsx
"use client"

import { useState } from "react"
import {
  MessageSquarePlus,
  Lightbulb,
  Bug,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { submitFeedbackAction } from "./actions"

type FeedbackType = "suggestion" | "bug_report" | "general"

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: typeof Lightbulb }[] = [
  { id: "suggestion", label: "Suggestion / Idea", icon: Lightbulb },
  { id: "bug_report", label: "Bug Report", icon: Bug },
  { id: "general", label: "General Feedback", icon: HelpCircle },
]

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("suggestion")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please provide both a title and description.",
      })
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    const res = await submitFeedbackAction({
      feedbackType: type,
      title,
      description,
    })

    setIsSubmitting(false)

    if (res.success) {
      setTitle("")
      setDescription("")
      setStatusMessage({
        type: "success",
        text: "Thank you! Your feedback has been recorded.",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to submit feedback.",
      })
    }
  }


return (
  <div className="mx-auto max-w-4xl space-y-8 px-4 pb-8 sm:px-6 lg:px-0">
    {/* ── Page Header ── */}
    <header className="flex min-h-[3rem] items-center justify-between">
      <div className="max-w-[58%] lg:max-w-none">
        <h1 className="text-xl font-semibold tracking-tight text-[#2d3436] sm:text-2xl">
          Feedback &amp; Suggestions
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-500 sm:text-sm">
          Help shape future iterations. Standard users can submit 1 idea every 24 hours.
        </p>
      </div>
    </header>

    {/* ── Form Card ── */}
    <div className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status alert */}
        {statusMessage && (
          <div
            role={statusMessage.type === "success" ? "status" : "alert"}
            className={`flex items-start gap-2.5 rounded-2xl border p-4 text-[13px] font-medium ${
              statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-100 bg-red-50 text-[#c2492f]"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#c2492f]" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Feedback category */}
        <div>
          <span id="fb-type-label" className={fieldLabel}>
            Feedback Category
          </span>
          <div
            role="group"
            aria-labelledby="fb-type-label"
            className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3"
          >
            {FEEDBACK_TYPES.map((item) => {
              const Icon = item.icon
              const isSelected = type === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setType(item.id)}
                  className={`flex h-12 items-center justify-center gap-2 px-3 ${optionBase} ${
                    isSelected ? optionOn : optionOff
                  }`}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.8}
                    className={isSelected ? "text-white" : "text-gray-400"}
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="fb-title" className={fieldLabel}>
            Subject{required}
          </label>
          <input
            id="fb-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Add recurring monthly target for Emergency Vault"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="fb-desc" className={fieldLabel}>
            Description &amp; Context{required}
          </label>
          <textarea
            id="fb-desc"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the feature or bug with as much detail as possible..."
            className={`${fieldBase} resize-none py-4 leading-relaxed`}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2d3436] px-8 text-[15px] font-semibold text-white transition-all hover:bg-[#1f2526] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d3436]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <MessageSquarePlus size={16} strokeWidth={1.8} />
                <span>Submit Suggestion</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)
}


// ── Form tokens (same as LogEmergencySpendModal; move to lib/form-styles.ts) ──
const fieldBase =
  "w-full min-w-0 rounded-2xl border border-transparent bg-gray-50 px-5 text-base font-medium text-[#2d3436] outline-hidden transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-[#8b9dc3] focus:bg-white focus:ring-4 focus:ring-[#8b9dc3]/15"
const inputCls = `${fieldBase} h-12 sm:h-14`
const fieldLabel =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
const optionBase =
  "rounded-2xl border text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8b9dc3]/25"
const optionOn = "border-[#2d3436] bg-[#2d3436] text-white"
const optionOff = "border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50"
const required = <span aria-hidden> *</span>