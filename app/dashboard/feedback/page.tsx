// // app/dashboard/feedback/page.tsx
// import { createClient } from "@/utils/supabase/server"
import { getPublicFeedback } from "./actions"
import FeedbackClientWorkspace from "@/app/dashboard/components/FeedbackClientWorkspace"

export default async function FeedbackPage() {
  const initialItems = await getPublicFeedback()

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:px-0">
      {/* ── Page Header ── */}
      <header className="flex min-h-[3rem] items-center justify-between">
        <div className="max-w-[58%] lg:max-w-none">
          <h1 className="text-xl font-semibold tracking-tight text-[#2d3436] sm:text-2xl">
            Feedback &amp; Open Roadmap
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500 sm:text-sm">
            Help shape the app. Submit ideas (1 per 24 hours) and see live community submissions.
          </p>
        </div>
      </header>

      <FeedbackClientWorkspace initialItems={initialItems} />
    </div>
  )
}