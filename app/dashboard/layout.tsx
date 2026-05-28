// // app/dashboard/layout.tsx
// import { getDashboardData } from "./actions"
// import { DashboardProvider } from "./DashboardProvider"
// import ExpenseModal from "@/components/ExpenseForm/ExpenseModal"
// import { connection } from 'next/server'

// export default async function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {

//   await connection() 
//   // Single call — all data logic lives in actions.ts
//   const initialData = await getDashboardData()

//   return (
//     <DashboardProvider initialData={initialData}>
//       <div className="min-h-screen bg-gray-50 flex flex-col">
//         {/* Shared sidebar / header goes here */}

//         <main className="flex-1 p-6">{children}</main>

//         {/* Global modal — triggered from anywhere via context */}
//         <ExpenseModal />
//       </div>
//     </DashboardProvider>
//   )
// }




export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
     
      <div>
       
        <main>{children}</main>
      </div>
    </>
  )
}