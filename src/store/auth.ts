import { create } from 'zustand'
import { getAuthAdapter, type AuthUser } from '../lib/auth'
import { serverWalletUser, setServerWalletUser } from '../lib/walletServer'
import { useWallet } from './wallet'
import { usePortfolio } from './portfolio'
import { useMembership } from './membership'

interface UserSnapshot {
  wallet: { balances: Record<string, number>; transactions: unknown[] }
  portfolio: { holdings: unknown[]; plans: unknown[] }
  membership: { tier: unknown; vip: unknown; giveawayEntries: string[] }
}

function snapshotKey(userId: string) {
  return `meridian-demo-snapshot.${userId}`
}

function takeSnapshot(userId: string) {
  const w = useWallet.getState()
  const p = usePortfolio.getState()
  const m = useMembership.getState()
  const snapshot: UserSnapshot = {
    wallet: { balances: w.balances, transactions: w.transactions },
    portfolio: { holdings: p.holdings, plans: p.plans },
    membership: { tier: m.tier, vip: m.vip, giveawayEntries: m.giveawayEntries },
  }
  try {
    localStorage.setItem(snapshotKey(userId), JSON.stringify(snapshot))
  } catch {
    /* storage full — skip */
  }
}

function restoreSnapshot(userId: string): boolean {
  try {
    const raw = localStorage.getItem(snapshotKey(userId))
    if (!raw) return false
    const s = JSON.parse(raw) as UserSnapshot
    useWallet.setState({ balances: s.wallet.balances, transactions: s.wallet.transactions as never })
    usePortfolio.setState({ holdings: s.portfolio.holdings as never, plans: s.portfolio.plans as never })
    useMembership.setState({ tier: s.membership.tier as never, vip: s.membership.vip as never, giveawayEntries: s.membership.giveawayEntries })
    return true
  } catch {
    return false
  }
}

function resetToSeed() {
  useWallet.getState().reset()
  usePortfolio.getState().reset()
  useMembership.setState({ tier: 'standard', vip: 'none', giveawayEntries: [] })
}

interface AuthState {
  user: AuthUser | null
  initialized: boolean
  busy: boolean
  init: () => void
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  initialized: false,
  busy: false,

  init: () => {
    if (get().initialized) return
    // Mark initialized immediately so the UI doesn't hang; fill in user async.
    set({ initialized: true })
    void getAuthAdapter()
      .getSession()
      .then(async (user) => {
        if (user) {
          setServerWalletUser(user.id)
          try {
            await useWallet.getState().syncFromServer()
          } catch {
            /* keep local wallet */
          }
        }
        set({ user })
      })
      .catch(() => set({ user: null }))
  },

  signUp: async (name, email, password) => {
    set({ busy: true })
    try {
      const { user, error } = await getAuthAdapter().signUp(name, email, password)
      if (error || !user) return error ?? 'Sign up failed.'
      setServerWalletUser(user.id)
      // Server-backed wallet seeds the opening balances; fall back to local seed.
      if (!(await useWallet.getState().syncFromServer().catch(() => false))) resetToSeed()
      set({ user })
      return null
    } finally {
      set({ busy: false })
    }
  },

  signIn: async (email, password) => {
    set({ busy: true })
    try {
      const { user, error } = await getAuthAdapter().signIn(email, password)
      if (error || !user) return error ?? 'Sign in failed.'
      setServerWalletUser(user.id)
      let synced = false
      try {
        synced = await useWallet.getState().syncFromServer()
      } catch {
        synced = false
      }
      if (!synced && !restoreSnapshot(user.id)) resetToSeed()
      set({ user })
      return null
    } finally {
      set({ busy: false })
    }
  },

  signOut: async () => {
    const { user } = get()
    // Server-backed wallets are already persisted; only snapshot local wallets.
    if (user && !serverWalletUser()) takeSnapshot(user.id)
    setServerWalletUser(null)
    await getAuthAdapter().signOut()
    resetToSeed()
    set({ user: null })
  },

  resetPassword: async (email: string) => {
    set({ busy: true })
    try {
      const { error } = await getAuthAdapter().resetPassword(email)
      return error
    } finally {
      set({ busy: false })
    }
  },
}))
