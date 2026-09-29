import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Holding {
  symbol: string
  qty: number
  avgPrice: number
}

export interface PlanAllocation {
  planId: string
  amount: number
  date: string
}

interface PortfolioState {
  holdings: Holding[]
  plans: PlanAllocation[]
  buy: (symbol: string, qty: number, price: number) => void
  sell: (symbol: string, qty: number, price: number) => boolean
  startPlan: (planId: string, amount: number) => void
  reset: () => void
}

const seedHoldings: Holding[] = [
  { symbol: 'MRDN', qty: 40, avgPrice: 171.4 },
  { symbol: 'NOVAP', qty: 12, avgPrice: 298.2 },
  { symbol: 'ETH', qty: 2, avgPrice: 3410.0 },
  { symbol: 'SOL', qty: 15, avgPrice: 188.5 },
]

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: seedHoldings,
      plans: [{ planId: 'balanced', amount: 5000, date: new Date(Date.now() - 86400000 * 30).toISOString() }],
      buy: (symbol, qty, price) =>
        set((s) => {
          const existing = s.holdings.find((h) => h.symbol === symbol)
          if (!existing) return { holdings: [...s.holdings, { symbol, qty, avgPrice: price }] }
          const totalQty = existing.qty + qty
          const avgPrice = (existing.qty * existing.avgPrice + qty * price) / totalQty
          return {
            holdings: s.holdings.map((h) => (h.symbol === symbol ? { ...h, qty: totalQty, avgPrice } : h)),
          }
        }),
      sell: (symbol, qty, price) => {
        void price
        const existing = get().holdings.find((h) => h.symbol === symbol)
        if (!existing || qty <= 0 || qty > existing.qty) return false
        set((s) => ({
          holdings: s.holdings
            .map((h) => (h.symbol === symbol ? { ...h, qty: h.qty - qty } : h))
            .filter((h) => h.qty > 0.000001),
        }))
        return true
      },
      startPlan: (planId, amount) =>
        set((s) => ({
          plans: [{ planId, amount, date: new Date().toISOString() }, ...s.plans],
        })),
      reset: () => set({ holdings: seedHoldings, plans: [] }),
    }),
    { name: 'meridian-portfolio' },
  ),
)
