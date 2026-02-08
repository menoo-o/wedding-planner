"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import type { LoginState } from "@/lib/types";


const initialLoginState: LoginState = {
  error: null,
  issues: {},
};


export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialLoginState
  );

  return (
    <form action={formAction} className="login-form">

  {/* Email */}
  <div className="form-field">
    <input
      name="email"
      type="email"
      placeholder="Email"
      disabled={isPending}
      className={`form-input ${state.issues?.email ? "input-error" : ""}`}
    />
    {state.issues?.email && (
      <p className="field-error">{state.issues.email[0]}</p>
    )}
  </div>

  {/* Password */}
  <div className="form-field">
    <input
      name="password"
      type="password"
      placeholder="Password"
      disabled={isPending}
      className={`form-input ${state.issues?.password ? "input-error" : ""}`}
    />
    {state.issues?.password && (
      <p className="field-error">{state.issues.password[0]}</p>
    )}
  </div>

  {/* Global error */}
  {state.error && <p className="form-error">{state.error}</p>}

  <button
    type="submit"
    className="submit-btn"
    disabled={isPending}
  >
    {isPending ? "Logging in..." : "Login"}
  </button>

    </form>

  );
}
