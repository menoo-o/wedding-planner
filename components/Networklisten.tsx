"use client"

import { useEffect } from "react"
import { useToastStore } from "@/store/Usetoaststore"
import { useNetworkStore } from "@/store/Usenetworkstore"

const PROBE_URL = "/api/health"
const PROBE_TIMEOUT_MS = 4000
const HEARTBEAT_MS = 20_000
const FAILS_BEFORE_OFFLINE = 2

// Module-level so the exported checkNow() can be called from anywhere
// (e.g. after a failed mutation) and shares state with the listener.
let consecutiveFails = 0
let inFlight: Promise<void> | null = null

async function probe(): Promise<boolean> {
  // Cheap short-circuit: the browser itself says there's no network at all.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    // Cache-buster + no-store so neither the HTTP cache nor a service worker
    // can answer for us. Any response (even 5xx) proves the network path works.
    const res = await fetch(`${PROBE_URL}?t=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    })
    return res.status < 600
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export function checkNow(): Promise<void> {
  if (inFlight) return inFlight // de-dupe overlapping triggers

  inFlight = (async () => {
    const ok = await probe()
    const { status, setStatus } = useNetworkStore.getState()
    const { showToast } = useToastStore.getState()

    if (ok) {
      consecutiveFails = 0
      if (status !== "online") {
        setStatus("online")
        // Only toast the recovery if we'd actually told them they were offline.
        if (status === "offline") showToast("Back online — data is syncing", "online")
      }
    } else {
      consecutiveFails += 1
      // navigator.onLine === false is trustworthy, so skip hysteresis for it.
      const hardOffline = typeof navigator !== "undefined" && navigator.onLine === false
      if (status !== "offline" && (hardOffline || consecutiveFails >= FAILS_BEFORE_OFFLINE)) {
        setStatus("offline")
        showToast("You're offline — what you see may be out of date", "offline")
      }
    }
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

export default function NetworkListener() {
  useEffect(() => {
    // 1. On load — catches the "opened a cached dashboard while offline" case.
    checkNow()

    // 2. Events are only *hints*: verify with a real probe instead of trusting them.
    const onHint = () => checkNow()
    const onVisible = () => {
      if (document.visibilityState === "visible") checkNow()
    }
    window.addEventListener("online", onHint)
    window.addEventListener("offline", onHint)
    window.addEventListener("focus", onHint)
    document.addEventListener("visibilitychange", onVisible)

    // 3. Heartbeat — catches silent drops. Skip while the tab is hidden.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") checkNow()
    }, HEARTBEAT_MS)

    return () => {
      window.removeEventListener("online", onHint)
      window.removeEventListener("offline", onHint)
      window.removeEventListener("focus", onHint)
      document.removeEventListener("visibilitychange", onVisible)
      clearInterval(interval)
    }
  }, [])

  return null
}