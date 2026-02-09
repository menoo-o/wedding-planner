"use client"

import { useState, useEffect } from "react"
import TimeUnit from "./Hero-TimeUnit"
import './hero.css'
import RollingNumber from "./Rolling-Animation"

export default function CountdownTimer() {
  const targetDate = new Date("2026-03-14T19:30:00+03:00").getTime();

   // ✅ start with null (no time math during render)
  const [distance, setDistance] = useState<number | null>(null);

  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    console.log("⏱️ Timer Mount: Starting 1s interval");
    // ✅ set initial value on client
    const update = () => {
      const remaining = targetDate - Date.now();

      if (remaining <= 0) {
        setDistance(0);
        return false;
      }

      setDistance(remaining);
      return true;
    };

    update(); // run immediately on mount

const interval = setInterval(update, 1000);

  // 2. THE TRIGGER: Flip the switch after the animation finishes
  // If your GSAP duration is 3s and max delay is 0.6s, 4 seconds is perfect.
  const timer = setTimeout(() => {
    setIsRolling(false); 
    console.log("Animation finished, switching to live timer!");
  }, 4000);

    return () => {
      console.log("♻️ Timer Unmount: Cleaning up intervals/timeouts");
    clearInterval(interval);
      clearTimeout(timer);
    }
  }, [targetDate]);

  // ✅ guard render until client value exists
  if (distance === null) {
    return null; // or skeleton / placeholder
  }

  // 👉 DERIVED VALUES (still correct)
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);


  return (
    <section className="hero-countdown">
    <div className="hero-countdown__content">
      {/* TIMER */}
      <div className="hero-countdown__timer">
        <div className="timer-grid">
          {/* DAYS */}
          <div className="timer-col timer-days">
            <TimeUnit 
             value={isRolling ? 
            <RollingNumber startValue={99} endValue={days} delay={0} /> : days } 
             label="Days" 
             variant="days"/>
          </div>

          {/* HOURS */}
          <div className="timer-col">
            <TimeUnit 
             value={isRolling ? 
             <RollingNumber startValue={24} endValue={hours} delay={0.2} /> : hours } 
             label="Hours" variant="hours" />
          </div>

          {/* MINS + SECS */}
          <div className="timer-col timer-col--stack">
            <TimeUnit 
            value={isRolling ? 
           <RollingNumber startValue={59} endValue={minutes} delay={0.4} /> : minutes} 
            label="Minutes" 
            variant="minutes" />
            <TimeUnit 
            value={isRolling ? 
            <RollingNumber startValue={59} endValue={seconds} delay={0.6} /> : seconds } 
            label="Seconds" 
            variant="seconds" />
          </div>
        </div>
      </div>

   
    </div>
</section>
  )
} 