import { create } from 'zustand'
import { fetchLiveQuotes, type LiveQuotes } from '../lib/prices'

interface PriceState {
  quotes: LiveQuotes
  /** True once at least one provider has succeeded. */
  live: boolean
  updatedAt: number | null
  refreshing: boolean
  refresh: () => Promise<void>
}

export const usePrices = create<PriceState>()((set, get) => ({
  quotes: {},
  live: false,
  updatedAt: null,
  refreshing: false,
  refresh: async () => {
    if (get().refreshing) return
    set({ refreshing: true })
    try {
      const quotes = await fetchLiveQuotes()
      if (quotes) set({ quotes, live: true, updatedAt: Date.now() })
      // On total failure we keep the last good quotes (or none) and stay on
      // mock prices — the UI never breaks because a price feed is down.
    } finally {
      set({ refreshing: false })
    }
  },
}))

const POLL_MS = 60_000
let pollId: number | null = null

/** Starts the 60s price poll. Safe to call multiple times. */
export function startPricePolling(): void {
  if (pollId !== null) return
  void usePrices.getState().refresh()
  pollId = window.setInterval(() => {
    void usePrices.getState().refresh()
  }, POLL_MS)
}
