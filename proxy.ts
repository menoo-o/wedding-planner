import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // just protect dashboard route for now
  matcher: [
    '/dashboard/:path*',

  ],
}