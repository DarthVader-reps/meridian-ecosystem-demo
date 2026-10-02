import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'

export interface Order {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  price: number
  date: string
}

export interface Position {
  symbol: string
  qty: number
  avgPrice: number
}

interface TradingState {
  demoBalance: number
  positions: Position[]
  orders: Order[]
  placeOrder: (symbol: string, side: 'buy' | 'sell', qty: number, price: number) => boolean
  botRunning: boolean
  botStrategy: string
  botLog: string[]
  startBot: (strategy: string) => void
  pauseBot: () => void
  botTick: () => void
  copiedTraders: string[]
  copyTrader: (id: string) => void
  stopCopy: (id: string) => void
  managedApplications: string[]
  applyManaged: (id: string) => void
  reset: () => void
}

const seedOrders: Order[] = [
  { id: 'seed-o1', symbol: 'MRDN', side: 'buy', qty: 10, price: 178.2, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'seed-o2', symbol: 'ETH', side: 'buy', qty: 0.5, price: 3720.1, date: new Date(Date.now() - 86400000).toISOString() },
]

const BOT_LINES = [
  'Scanning momentum across 15 assets',
  'Mean-reversion signal on NOVAP, sizing 0.5%',
  'Volatility filter passed, holding cash 62%',
  'Trailing stop tightened on ETH position',
  'Correlation check complete, no new entries',
  'Taking partial profit on MRDN, +1.2% simulated',
]

export const useTrading = create<TradingState>()(
  persist(
    (set, get) => ({
      demoBalance: 100000,
      positions: [{ symbol: 'MRDN', qty: 10, avgPrice: 178.2 }],
      orders: seedOrders,
      placeOrder: (symbol, side, qty, price) => {
        if (qty <= 0 || price <= 0) return false
        const cost = qty * price
        const r8 = (n: number) => Math.round(n * 1e8) / 1e8
        if (side === 'buy') {
          if (cost > get().demoBalance) return false
          set((s) => {
            const existing = s.positions.find((p) => p.symbol === symbol)
            const positions = existing
              ? s.positions.map((p) =>
                  p.symbol === symbol
                    ? { ...p, qty: r8(p.qty + qty), avgPrice: (p.qty * p.avgPrice + cost) / (p.qty + qty) }
                    : p,
                )
              : [...s.positions, { symbol, qty: r8(qty), avgPrice: price }]
            return {
              demoBalance: r8(s.demoBalance - cost),
              positions,
              orders: [{ id: uid('ord'), symbol, side, qty: r8(qty), price, date: new Date().toISOString() }, ...s.orders].slice(0, 200),
            }
          })
          return true
        }
        const existing = get().positions.find((p) => p.symbol === symbol)
        if (!existing || qty > existing.qty) return false
        set((s) => ({
          demoBalance: r8(s.demoBalance + cost),
          positions: s.positions
            .map((p) => (p.symbol === symbol ? { ...p, qty: r8(p.qty - qty) } : p))
            .filter((p) => p.qty > 0.000001),
          orders: [{ id: uid('ord'), symbol, side, qty: r8(qty), price, date: new Date().toISOString() }, ...s.orders].slice(0, 200),
        }))
        return true
      },
      botRunning: false,
      botStrategy: 'Balanced trend',
      botLog: ['Bot initialized with paper-trading engine.'],
      startBot: (strategy) =>
        set((s) => ({
          botRunning: true,
          botStrategy: strategy,
          botLog: [...s.botLog, `Strategy "${strategy}" started on simulated feed.`].slice(-100),
        })),
      pauseBot: () => set((s) => ({ botRunning: false, botLog: [...s.botLog, 'Bot paused by user.'].slice(-100) })),
      botTick: () =>
        set((s) => {
          if (!s.botRunning) return s
          const line = BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]
          return { botLog: [...s.botLog, `${new Date().toLocaleTimeString()} — ${line}`].slice(-100) }
        }),
      copiedTraders: ['t3'],
      copyTrader: (id) => set((s) => ({ copiedTraders: s.copiedTraders.includes(id) ? s.copiedTraders : [...s.copiedTraders, id] })),
      stopCopy: (id) => set((s) => ({ copiedTraders: s.copiedTraders.filter((t) => t !== id) })),
      managedApplications: [],
      applyManaged: (id) =>
        set((s) => ({ managedApplications: s.managedApplications.includes(id) ? s.managedApplications : [...s.managedApplications, id] })),
      reset: () => set({ demoBalance: 100000, positions: [{ symbol: 'MRDN', qty: 10, avgPrice: 178.2 }], orders: seedOrders, botRunning: false, botLog: [], copiedTraders: [], managedApplications: [] }),
    }),
    { name: 'meridian-trading' },
  ),
)
