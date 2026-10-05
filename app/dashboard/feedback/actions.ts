// app/dashboard/feedback/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export interface FeedbackInput {
  feedbackType: "suggestion" | "bug_report" | "general"
  title: string
  description: string
}

export async function submitFeedbackAction(data: FeedbackInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("user_feedback").insert({
    user_id: user?.id || null,
    user_email: user?.email || null,
    feedback_type: data.feedbackType,
    title: data.title.trim(),
    description: data.description.trim(),
  })

  if (error) {
    if (error.message.includes("Rate limit exceeded")) {
      return {
        success: false,
        error: "You have already submitted a suggestion in the last 24 hours.",
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/feedback")
  return { success: true }
}