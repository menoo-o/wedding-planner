// app/dashboard/feedback/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export interface FeedbackItem {
  id: string
  user_id: string | null
  feedback_type: "suggestion" | "bug_report" | "general"
  title: string
  description: string
  status: "pending" | "under_review" | "implemented" | "dismissed"
  created_at: string
}

export interface FeedbackInput {
  feedbackType: "suggestion" | "bug_report" | "general"
  title: string
  description: string
}

// 1. Fetch public list for the display board
export async function getPublicFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_feedback")
    .select("id, user_id, feedback_type, title, description, status, created_at")
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) {
    console.error("Failed to fetch public feedback:", error.message)
    return []
  }

  return (data || []) as FeedbackItem[]
}

// 2. Submit new feedback
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
        error: "Rate limit: You can submit 1 feedback every 24 hours.",
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/feedback")
  return { success: true }
}