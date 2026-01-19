"use client"

import { useState, useEffect } from "react"
import TimeUnit from "./Hero-TimeUnit"

export default function CountdownTimer() {
  const targetDate = new Date("2026-03-14T00:00:00").getTime()

  const [distance, setDistance] = useState(
    targetDate - Date.now()
  )

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
    <header className="hero-countdown__header">
      <h1 className="hero-countdown__title">
        Countdown Timer
      </h1>
      <p className="hero-countdown__subtitle">
        Time until the event
      </p>
    </header>

    <div className="hero-countdown__timer timer-container">
      <div className="hero-countdown__units">
        <TimeUnit value={days} label="Days" />
        <TimeUnit value={hours} label="Hours" />
        <TimeUnit value={minutes} label="Minutes" />
        <TimeUnit value={seconds} label="Seconds" />
      </div>
    </div>

    <footer className="hero-countdown__footer">
      <small className="hero-countdown__footnote">
        Default countdown: 30 days from now
      </small>
    </footer>
  </div>
</section>

  )
}
