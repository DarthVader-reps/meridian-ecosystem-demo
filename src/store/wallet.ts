import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'
import { loadServerWallet, persistWalletMutation, type ServerTxInput } from '../lib/walletServer'

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
  /** True when this account's transactions were frozen. Mutations are blocked. */
  frozen: boolean
  deposit: (asset: string, amount: number, detail?: string) => boolean
  withdraw: (asset: string, amount: number, detail?: string) => boolean
  transfer: (fromAsset: string, toAsset: string, amount: number) => boolean
  swap: (fromAsset: string, toAsset: string, amount: number, rate: number) => boolean
  recordTrade: (asset: string, amount: number, detail: string) => void
  reset: () => void
  /**
   * Loads balances + ledger + freeze flag from Supabase for the signed-in user.
   * Returns true when the wallet is server-backed, false when local-only.
   */
  syncFromServer: () => Promise<boolean>
}

/**
 * New sign-ups start at zero. There are no opening balances: users fund
 * their wallet through deposits, which require review before they credit (build 10).
 */
const initialBalances: Record<string, number> = {}

const seedTransactions: Tx[] = []

function pushTx(transactions: Tx[], tx: Omit<Tx, 'id' | 'date'>): Tx[] {
  return [{ ...tx, id: uid('tx'), date: new Date().toISOString() }, ...transactions].slice(0, 200)
}

/** Round to 8 decimals so float artifacts (e.g. 0.1 + 0.2) never reach balances. */
const round8 = (n: number) => Math.round(n * 1e8) / 1e8

/**
 * Fire-and-forget server persist. Local state is already updated optimistically;
 * a failed write is logged and retried on the next mutation / login sync.
 */
function persistSoon(balances: Record<string, number>, tx?: ServerTxInput): void {
  void persistWalletMutation(balances, tx).catch((e) => {
    console.warn('[wallet] server persist failed', e)
  })
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      balances: initialBalances,
      transactions: seedTransactions,
      frozen: false,
      deposit: (asset, amount, detail) => {
        if (get().frozen) return false
        if (amount <= 0) return false
        const tx = { type: 'deposit' as const, asset, amount: round8(amount), detail }
        set((s) => ({
          balances: { ...s.balances, [asset]: round8((s.balances[asset] ?? 0) + amount) },
          transactions: pushTx(s.transactions, tx),
        }))
        persistSoon(get().balances, tx)
        return true
      },
      withdraw: (asset, amount, detail) => {
        if (get().frozen) return false
        const bal = get().balances[asset] ?? 0
        if (amount <= 0 || amount > bal) return false
        const tx = { type: 'withdraw' as const, asset, amount: round8(-amount), detail }
        set((s) => ({
          balances: { ...s.balances, [asset]: round8(bal - amount) },
          transactions: pushTx(s.transactions, tx),
        }))
        persistSoon(get().balances, tx)
        return true
      },
      transfer: (fromAsset, toAsset, amount) => {
        if (get().frozen) return false
        const bal = get().balances[fromAsset] ?? 0
        if (amount <= 0 || amount > bal || fromAsset === toAsset) return false
        const tx = {
          type: 'transfer' as const,
          asset: fromAsset,
          amount: round8(-amount),
          detail: `Transfer ${fromAsset} → ${toAsset}`,
        }
        set((s) => ({
          balances: {
            ...s.balances,
            [fromAsset]: round8(bal - amount),
            [toAsset]: round8((s.balances[toAsset] ?? 0) + amount),
          },
          transactions: pushTx(s.transactions, tx),
        }))
        persistSoon(get().balances, tx)
        return true
      },
      swap: (fromAsset, toAsset, amount, rate) => {
        if (get().frozen) return false
        const bal = get().balances[fromAsset] ?? 0
        if (amount <= 0 || amount > bal || rate <= 0 || fromAsset === toAsset) return false
        const received = amount * rate
        const tx = {
          type: 'swap' as const,
          asset: fromAsset,
          amount: round8(-amount),
          detail: `Swap ${fromAsset} → ${toAsset} @ ${rate}`,
        }
        set((s) => ({
          balances: {
            ...s.balances,
            [fromAsset]: round8(bal - amount),
            [toAsset]: round8((s.balances[toAsset] ?? 0) + received),
          },
          transactions: pushTx(s.transactions, tx),
        }))
        persistSoon(get().balances, tx)
        return true
      },
      recordTrade: (asset, amount, detail) => {
        if (get().frozen) return
        const tx = { type: 'trade' as const, asset, amount, detail }
        set((s) => ({
          transactions: pushTx(s.transactions, tx),
        }))
        persistSoon(get().balances, tx)
      },
      reset: () => {
        set({ balances: initialBalances, transactions: seedTransactions })
        persistSoon(initialBalances)
      },
      syncFromServer: async () => {
        const snap = await loadServerWallet()
        if (!snap) return false
        set({ balances: snap.balances, transactions: snap.transactions, frozen: snap.frozen })
        return true
      },
    }),
    { name: 'meridian-wallet' },
  ),
)
