"use client"

import { useState, useEffect } from "react"
import TimeUnit from "./Hero-TimeUnit"

export default function CountdownTimer() {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Set target date to 30 days from now
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 30)

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance < 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(interval)
      } else {
        setTime({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

 

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
        <TimeUnit value={time.days} label="Days" />
        <TimeUnit value={time.hours} label="Hours" />
        <TimeUnit value={time.minutes} label="Minutes" />
        <TimeUnit value={time.seconds} label="Seconds" />
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
