// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not add logic between createServerClient() and getClaims() —
  // setAll() above only fires as a side effect of this call, and anything
  // inserted before it can interfere with session/cookie refresh.
  let user = undefined
  let authCheckFailed = false

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getClaims(),
      5000,
      "middleware.getClaims"
    )
    if (error) {
      console.error("Middleware auth error:", error)
      authCheckFailed = true
    } else {
      user = data?.claims
    }
  } catch (err) {
    console.error("Middleware auth call failed/timed out:", err)
    authCheckFailed = true
  }

  return { response: supabaseResponse, user, authCheckFailed }
}