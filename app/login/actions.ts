"use server";

import { loginSchema } from "@/lib/zod/loginSchema";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import type { LoginState } from "@/lib/types";

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // ✅ Zod validation
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    return {
      error: "Invalid input",
      issues: flattened.fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  // ✅ Supabase auth
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
      issues: {},
    };
  }

  redirect("/dashboard");
}
