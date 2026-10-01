import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'

export type TxType = 'deposit' | 'withdraw' | 'transfer' | 'swap' | 'trade'

export interface Tx {
  id: string
  type: TxType
  asset: string
  amount: number
  detail?: string
  date: string
}

interface WalletState {
  balances: Record<string, number>
  transactions: Tx[]
  deposit: (asset: string, amount: number, detail?: string) => void
  withdraw: (asset: string, amount: number, detail?: string) => boolean
  transfer: (fromAsset: string, toAsset: string, amount: number) => boolean
  swap: (fromAsset: string, toAsset: string, amount: number, rate: number) => boolean
  recordTrade: (asset: string, amount: number, detail: string) => void
  reset: () => void
}

const initialBalances: Record<string, number> = { USD: 25000, BTC: 0.25, ETH: 2.5 }

const seedTransactions: Tx[] = [
  { id: 'seed-1', type: 'deposit', asset: 'USD', amount: 25000, detail: 'Opening demo balance', date: new Date(Date.now() - 86400000 * 12).toISOString() },
  { id: 'seed-2', type: 'swap', asset: 'USD', amount: -3200, detail: 'Swap USD → BTC', date: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: 'seed-3', type: 'swap', asset: 'BTC', amount: 0.25, detail: 'Swap USD → BTC', date: new Date(Date.now() - 86400000 * 6).toISOString() },
]

function pushTx(transactions: Tx[], tx: Omit<Tx, 'id' | 'date'>): Tx[] {
  return [{ ...tx, id: uid('tx'), date: new Date().toISOString() }, ...transactions].slice(0, 200)
}

/** Round to 8 decimals so float artifacts (e.g. 0.1 + 0.2) never reach balances. */
const round8 = (n: number) => Math.round(n * 1e8) / 1e8

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      balances: initialBalances,
      transactions: seedTransactions,
      deposit: (asset, amount, detail) =>
        set((s) => ({
          balances: { ...s.balances, [asset]: round8((s.balances[asset] ?? 0) + amount) },
          transactions: pushTx(s.transactions, { type: 'deposit', asset, amount: round8(amount), detail }),
        })),
      withdraw: (asset, amount, detail) => {
        const bal = get().balances[asset] ?? 0
        if (amount <= 0 || amount > bal) return false
        set((s) => ({
          balances: { ...s.balances, [asset]: round8(bal - amount) },
          transactions: pushTx(s.transactions, { type: 'withdraw', asset, amount: round8(-amount), detail }),
        }))
        return true
      },
      transfer: (fromAsset, toAsset, amount) => {
        const bal = get().balances[fromAsset] ?? 0
        if (amount <= 0 || amount > bal || fromAsset === toAsset) return false
        set((s) => ({
          balances: {
            ...s.balances,
            [fromAsset]: round8(bal - amount),
            [toAsset]: round8((s.balances[toAsset] ?? 0) + amount),
          },
          transactions: pushTx(s.transactions, {
            type: 'transfer',
            asset: fromAsset,
            amount: round8(-amount),
            detail: `Transfer ${fromAsset} → ${toAsset}`,
          }),
        }))
        return true
      },
      swap: (fromAsset, toAsset, amount, rate) => {
        const bal = get().balances[fromAsset] ?? 0
        if (amount <= 0 || amount > bal || rate <= 0 || fromAsset === toAsset) return false
        const received = amount * rate
        set((s) => ({
          balances: {
            ...s.balances,
            [fromAsset]: round8(bal - amount),
            [toAsset]: round8((s.balances[toAsset] ?? 0) + received),
          },
          transactions: pushTx(s.transactions, {
            type: 'swap',
            asset: fromAsset,
            amount: round8(-amount),
            detail: `Swap ${fromAsset} → ${toAsset} @ ${rate}`,
          }),
        }))
        return true
      },
      recordTrade: (asset, amount, detail) =>
        set((s) => ({
          transactions: pushTx(s.transactions, { type: 'trade', asset, amount, detail }),
        })),
      reset: () => set({ balances: initialBalances, transactions: seedTransactions }),
    }),
    { name: 'meridian-wallet' },
  ),
)
