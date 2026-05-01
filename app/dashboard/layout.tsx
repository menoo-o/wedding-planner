import Sidebar from "@/components/Dashboard-Sidebar/Sidebar"
// import './private.css'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
     
      <div className="dashboard-shell">
        <Sidebar />
        <main>{children}</main>
      </div>
    </>
  )
}