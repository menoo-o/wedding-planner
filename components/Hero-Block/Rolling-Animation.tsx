'use client'

// components/RollingNumber.tsx
import { useRef } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText'; 
import { useGSAP } from '@gsap/react';

interface RollingProps {
  startValue?: string | number
  endValue: string | number
  duration?: number
  delay?: number
  onComplete?: () => void
}

export default function RollingNumber({
  endValue,
  duration = 2.2,
  delay = 0,
  onComplete,
}: RollingProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = containerRef.current
      if (!root) return

      const h1 = root.querySelector("h1")
      if (!h1) return

      // FINAL value React will never touch again
      const finalStr = String(endValue).padStart(2, "0")
      h1.textContent = finalStr

      // Split into characters
      const split = new SplitText(h1, { type: "chars" })

      const tl = gsap.timeline({
        delay,
        onComplete,
      })

      split.chars.forEach((char, index) => {
        const glyph = char.textContent ?? ""

        // Two-layer swap structure (your original idea preserved)
        char.innerHTML = `
          <span className="slot-stack">
            <span className="slot-tile slot-tile--incoming">${glyph}</span>
            <span className="slot-tile slot-tile--current">${glyph}</span>
          </span>
        `

        const incoming = char.querySelector(
          ".slot-tile--incoming"
        ) as HTMLElement
        const current = char.querySelector(
          ".slot-tile--current"
        ) as HTMLElement

        // Incoming starts below, current visible
        gsap.set(incoming, { yPercent: 100 })
        gsap.set(current, { yPercent: 0 })

        // FAST SPIN (illusion of constant swapping)
        tl.to(
          [incoming, current],
          {
            repeat: 5,
            duration: 0.12,
            ease: "none",
            yPercent: "-=100",
            onRepeat: () => {
              gsap.set(incoming, { yPercent: 100 })
              gsap.set(current, { yPercent: 0 })
            },
          },
          0 // all digits spin together
        )

        // FINAL SETTLE (staggered thud)
        tl.to(
          [incoming, current],
          {
            yPercent: "-=100",
            duration: 0.7,
            ease: "power4.out",
          },
          0.9 + index * 0.1 // stagger per digit
        )
      })

      // Optional polish: blur + opacity
      tl.fromTo(
        root,
        { filter: "blur(4px)", opacity: 0.6 },
        { filter: "blur(0px)", opacity: 1, duration: 0.8 },
        0
      )

      return () => {
        split.revert()
        tl.kill()
      }
    },
    { scope: containerRef, dependencies: [endValue] }
  )

  return (
    <div
      ref={containerRef}
      className="rolling-container"
      style={{ overflow: "hidden" }}
    >
      {/* GSAP owns text content completely */}
      <h1 aria-hidden />
    </div>
  )
}