"use client"

import { useState, useEffect } from "react"
import TimeUnit from "./Hero-TimeUnit"
import './hero.css'

export default function CountdownTimer() {
  const targetDate = new Date("2026-03-14T19:30:00+03:00").getTime();

  const [distance, setDistance] = useState<number>(() => {
    const now = Date.now()
    return targetDate - now
  })
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = targetDate - Date.now()

      if (remaining <= 0) {
        setDistance(0)
        clearInterval(interval)
        return
      }

      setDistance(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  // 👉 DERIVED VALUES (no state)
  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((distance / (1000 * 60)) % 60)
  const seconds = Math.floor((distance / 1000) % 60)


  return (
    <section className="hero-countdown">
    <div className="hero-countdown__content">
      {/* TIMER */}
      <div className="hero-countdown__timer">
        <div className="timer-grid">
          {/* Column 1 */}
          <div className="timer-col timer-days">
            <TimeUnit value={days} label="Days" variant="days"/>
          </div>

          {/* Column 2 */}
          <div className="timer-col">
            <TimeUnit value={hours} label="Hours" variant="hours" />
          </div>

          {/* Column 3 (stacked) */}
          <div className="timer-col timer-col--stack">
            <TimeUnit value={minutes} label="Minutes" variant="minutes" />
            <TimeUnit value={seconds} label="Seconds" variant="seconds" />
          </div>
        </div>
      </div>

   
    </div>
</section>
  )
} 