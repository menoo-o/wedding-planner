import { redirect } from 'next/navigation'
import { logout } from './actions'
import { createClient } from '@/utils/supabase/server'
import './private.css'

export default async function Dashboard() {
  const supabase = await createClient()


  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/login')
  }
return (
   <div className="dashboard-container">

    <div className="dashboard-box">
      <h2 className="dashboard-title">User Data</h2>

      <ul className="dashboard-list">
        {Object.entries(data).map(([key, value]) => (
          <li key={key} className="dashboard-item">
            <span className="dashboard-key">{key}</span>
            <span className="dashboard-value">
              {typeof value === "object" ? JSON.stringify(value) : value}
            </span>
          </li>
        ))}
      </ul>
       
      <form action={logout}>
        <button type="submit" className="btn-logout">Logout User:ID {data?.claims.sub}</button>
      </form>
    </div>
    
  </div>
  );
}