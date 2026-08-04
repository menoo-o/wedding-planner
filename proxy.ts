import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { response, user, authCheckFailed } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Logged in users should not access login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Not logged in users cannot access dashboard —
  // but only redirect on a *confirmed* absence of session.
  // If the auth check itself failed/timed out (e.g. stale connection
  // after dev-server idle), let the request through and let the
  // page-level Suspense/error boundary handle it, rather than
  // silently logging out a genuinely authenticated user.
  if (pathname.startsWith("/dashboard") && !user) {
    if (authCheckFailed) {
      return response;
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  // Narrowed to only the routes that actually need the auth check —
  // the previous catch-all pattern ran getClaims() on every request
  // in the app, amplifying any Supabase connection hiccup app-wide.
  matcher: ['/dashboard/:path*', '/login'],
}