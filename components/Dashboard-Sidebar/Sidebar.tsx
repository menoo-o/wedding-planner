import React from 'react'  
import Link from 'next/link'
import './side.css'
function Sidebar() {
  return (
    <>
        <aside className="sidebar">
         <nav className="sidebar-nav">
            <ul className="sidebar-nav-list">
                <li className="sidebar-nav-item">
                    <Link href="/dashboard" className="sidebar-nav-link">
                        Dashboard
                    </Link>
                </li>
                <li className="sidebar-nav-item">
                    <Link href="/dashboard/expenses" className="sidebar-nav-link">
                        Expenses
                    </Link>
                </li>
                <li className="sidebar-nav-item">
                    <Link href="/dashboard/budget" className="sidebar-nav-link">
                        Balance  
                    </Link>
                </li>
                <li className="sidebar-nav-item">
                    <Link href="/dashboard/settings" className="sidebar-nav-link">
                        Settings
                    </Link>
                </li>
            </ul>
        </nav>
         
        </aside>
    </>
  )
}

export default Sidebar