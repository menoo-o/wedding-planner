// Create: app/dashboard/_lib/utils.ts
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

////////////////////////////////////////////////////////
export interface ExpenseTransaction {
  id: string
  amount: number
  transaction_type: string
  payment_account: string
  description: string
  category_id: string | null
  category_name?: string
  created_at: string
  paid_by?: string | null
  counterparty_name?: string | null
  reimbursement_status?: string | null
}

interface DayGroup {
  date: string
  label: string
  transactions: ExpenseTransaction[]
  dayTotal: number
}


//expenses page - helper fns

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday = date.toDateString() === today.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return "Today"
  if (isYesterday) return "Yesterday"

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function groupByDay(transactions: ExpenseTransaction[]): DayGroup[] {
  const groups = new Map<string, ExpenseTransaction[]>()

  for (const tx of transactions) {
    const dateKey = new Date(tx.created_at).toISOString().split("T")[0]
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey)!.push(tx)
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  return sortedKeys.map((key) => {
    const txs = groups.get(key)!
    const dayTotal = txs.reduce((sum, tx) => sum + tx.amount, 0)
    return {
      date: key,
      label: formatDateLabel(key),
      transactions: txs,
      dayTotal,
    }
  })
}

// Get top 3 categories by spending
export function getTopCategories(
  transactions: ExpenseTransaction[],
  allCategories: { id: string; name: string }[]
) {
  const categoryTotals = new Map<string, number>()
  transactions.forEach((tx) => {
    const catId = tx.category_id || "uncategorized"
    categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + tx.amount)
  })

  const sorted = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return sorted.map(([catId, total]) => {
    const cat = allCategories.find((c) => c.id === catId)
    return { id: catId, name: cat?.name || "General", total }
  })
}

