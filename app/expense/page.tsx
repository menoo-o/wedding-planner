// app/expense/page.tsx

import TransactionForm from "@/components/ExpenseForm/TransactionForm"
import { createClient } from "@/utils/supabase/server"

export default async function Page() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        New Transaction
      </h1>

      <TransactionForm categories={categories ?? []} />
    </div>
  )
}