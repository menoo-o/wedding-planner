"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear cached pages that depend on auth
  revalidatePath("/", "layout");

  // Send user back to login
  redirect("/login");
}
