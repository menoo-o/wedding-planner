import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";


// signout 
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // console.error("Sign out failed:", error.message);
    return;
  }

  redirect("/");
}
