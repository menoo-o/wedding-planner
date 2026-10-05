// app/dashboard/feedback/_components/FeedbackClientWorkspace.tsx
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
  Clock,
  Sparkles,
} from "lucide-react"
import { submitFeedbackAction, type FeedbackItem } from "../actions"

type FeedbackType = "suggestion" | "bug_report" | "general"

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: typeof Lightbulb }[] = [
  { id: "suggestion", label: "Suggestion", icon: Lightbulb },
  { id: "bug_report", label: "Bug Report", icon: Bug },
  { id: "general", label: "General", icon: HelpCircle },
]

export default function FeedbackClientWorkspace({
  initialItems,
}: {
  initialItems: FeedbackItem[]
}) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems)
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
        text: "Please provide both a subject and details.",
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
      // Optimistically append the newly added item to the board
      const newItem: FeedbackItem = {
        id: crypto.randomUUID(),
        user_id: null,
        feedback_type: type,
        title: title.trim(),
        description: description.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      }
      setItems((prev) => [newItem, ...prev])

      setTitle("")
      setDescription("")
      setStatusMessage({
        type: "success",
        text: "Thank you! Your submission is now on the board.",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: res.error || "Failed to submit feedback.",
      })
    }
  }

  // Helper for Status Badge styling
  const getStatusBadge = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            <CheckCircle2 size={10} /> Implemented
          </span>
        )
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
            <Clock size={10} /> Under Review
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold">
            Pending
          </span>
        )
    }
  }

 return (
  <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:items-start">
    {/* ── LEFT: Submission form (5 cols) ── */}
    <div className={`${card} p-5 sm:p-6 lg:col-span-5`}>
      <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Sparkles size={16} strokeWidth={1.8} />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-[#2d3436]">
          Have an idea or spotted a bug?
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Category */}
        <div>
          <span id="fb-type-label" className={fieldLabel}>
            Category
          </span>
          <div role="group" aria-labelledby="fb-type-label" className="grid grid-cols-3 gap-2">
            {FEEDBACK_TYPES.map((item) => {
              const Icon = item.icon
              const isSelected = type === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setType(item.id)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1.5 py-2 leading-tight sm:min-h-12 sm:flex-row sm:gap-2 sm:px-3 ${optionBase} ${
                    isSelected ? optionOn : optionOff
                  }`}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.8}
                    className={`shrink-0 ${isSelected ? "text-white" : "text-gray-400"}`}
                  />
                  <span className="text-center">{item.label}</span>
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
            placeholder="e.g. Add partial settlement for planned reserves"
            className={inputCls}
          />
        </div>

        {/* Details */}
        <div>
          <label htmlFor="fb-desc" className={fieldLabel}>
            Details{required}
          </label>
          <textarea
            id="fb-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain how it would help household accounting..."
            className={`${fieldBase} resize-none py-4 leading-relaxed`}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2d3436] text-[15px] font-semibold text-white transition-all hover:bg-[#1f2526] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d3436]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Posting idea...</span>
            </>
          ) : (
            <>
              <MessageSquarePlus size={16} strokeWidth={1.8} />
              <span>Post to Board</span>
            </>
          )}
        </button>
      </form>
    </div>

    {/* ── RIGHT: Public suggestion board (7 cols) ── */}
    <div className={`${card} overflow-hidden lg:col-span-7`}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-[#2d3436]">
            Public Suggestion Board
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-[13px]">
            All submitted ideas &amp; tracked updates
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold tabular-nums leading-none text-gray-600">
          {items.length} {items.length === 1 ? "submission" : "submissions"}
        </span>
      </div>

      {/* Feed — scrolls inside the card on desktop only; on phones the page scrolls */}
      <div className="lg:max-h-[640px] lg:overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Lightbulb size={24} strokeWidth={1.5} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-[#2d3436]">The board is currently clear</p>
            <p className="mt-1 text-[13px] text-gray-500">Be the first to propose an enhancement.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="space-y-2 px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        typeDot[item.feedback_type] ?? "bg-blue-500"
                      }`}
                    />
                    <h3 className="truncate text-sm font-semibold text-[#2d3436]">{item.title}</h3>
                  </div>
                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>

                <p className="break-words pl-[18px] text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pl-[18px] text-xs text-gray-500">
                  <span className="capitalize">{item.feedback_type.replace(/_/g, " ")}</span>
                  <span className="tabular-nums">
                    {new Date(item.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
)
}



// ── Tokens (same as LogEmergencySpendModal; move to lib/form-styles.ts) ──
const card = "rounded-2xl border border-gray-200/70 bg-white shadow-sm"
const fieldBase =
  "w-full min-w-0 rounded-2xl border border-transparent bg-gray-50 px-5 text-base font-medium text-[#2d3436] outline-hidden transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-[#8b9dc3] focus:bg-white focus:ring-4 focus:ring-[#8b9dc3]/15"
const inputCls = `${fieldBase} h-12`
const fieldLabel =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
const optionBase =
  "rounded-2xl border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8b9dc3]/25"
const optionOn = "border-[#2d3436] bg-[#2d3436] text-white"
const optionOff = "border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50"
const required = <span aria-hidden> *</span>

const typeDot: Record<string, string> = {
  bug_report: "bg-rose-500",
  suggestion: "bg-emerald-500",
}
