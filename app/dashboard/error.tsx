// app/dashboard/error.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const REDIRECT_DELAY_SECONDS = 6

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SECONDS)

  useEffect(() => {
    console.error(error)
  }, [error])

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push('/')
      return
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, router])

  return (
    <div className="dashboard-container" style={{ textAlign: 'center', padding: '2rem' }}>
      <p>Something went wrong loading your dashboard.</p>
      <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
        Taking you back to the home page in {secondsLeft}s…
      </p>
      <button onClick={() => { setSecondsLeft(REDIRECT_DELAY_SECONDS); reset() }}>
        Try again instead
      </button>
    </div>
  )
}