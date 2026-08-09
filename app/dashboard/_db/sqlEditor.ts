import { createClient } from '@/utils/supabase/server' // your existing server client

export async function runQuery(query: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('run_readonly_query', { query })
  if (error) throw new Error(error.message)
  return data as Record<string, any>[]
}