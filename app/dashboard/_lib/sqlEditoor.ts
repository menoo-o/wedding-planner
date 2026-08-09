'use server'
import { runQuery } from '@/app/dashboard/_db/sqlEditor'


export async function executeSqlQuery(query: string) {
  try {
    const rows = await runQuery(query)
    return { rows, error: null }
  } catch (e) {
    return { rows: null, error: e instanceof Error ? e.message : 'Query failed' }
  }
}