// app/api/health/route.ts
// Tiny, uncached endpoint used only to answer "can this browser reach us?"
//
// With `cacheComponents` enabled, route segment config like
// `export const dynamic = "force-dynamic"` is not allowed. Instead we opt into
// request-time rendering by awaiting connection(), so this handler is never
// prerendered at build time.
import { connection } from "next/server"

const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" }

export async function GET() {
  await connection()
  return new Response(null, { status: 204, headers })
}

export async function HEAD() {
  await connection()
  return new Response(null, { status: 204, headers })
}