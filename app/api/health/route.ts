// app/api/health/route.ts
// Tiny, uncached endpoint used only to answer "can this browser reach us?"
export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  })
}

export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  })
}