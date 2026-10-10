// store/useNetworkStore.ts
import { create } from "zustand"

// "unknown" = haven't probed yet (first paint). Treat it as optimistic in the
// UI, but never as proof of being online.
export type NetworkStatus = "unknown" | "online" | "offline"

interface NetworkState {
  status: NetworkStatus
  lastCheckedAt: number | null
  setStatus: (status: NetworkStatus) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  status: "unknown",
  lastCheckedAt: null,
  setStatus: (status) => set({ status, lastCheckedAt: Date.now() }),
}))

// Handy for guarding writes anywhere (server-action callers, forms, etc.)
export const isOffline = () => useNetworkStore.getState().status === "offline"