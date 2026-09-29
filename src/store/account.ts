import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'

export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

export interface Ticket {
  id: string
  subject: string
  status: 'open' | 'answered'
  date: string
}

interface AccountState {
  name: string
  email: string
  verification: VerificationStatus
  twoFA: boolean
  notifications: { market: boolean; product: boolean; security: boolean }
  tickets: Ticket[]
  updateProfile: (name: string, email: string) => void
  setVerification: (s: VerificationStatus) => void
  toggle2FA: () => void
  setNotifications: (n: Partial<AccountState['notifications']>) => void
  addTicket: (subject: string) => void
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      name: 'Demo User',
      email: 'demo@example.com',
      verification: 'unverified',
      twoFA: false,
      notifications: { market: true, product: true, security: true },
      tickets: [
        { id: 't-1', subject: 'How do simulated swaps settle?', status: 'answered', date: new Date(Date.now() - 86400000 * 4).toISOString() },
      ],
      updateProfile: (name, email) => set({ name, email }),
      setVerification: (verification) => set({ verification }),
      toggle2FA: () => set((s) => ({ twoFA: !s.twoFA })),
      setNotifications: (n) => set((s) => ({ notifications: { ...s.notifications, ...n } })),
      addTicket: (subject) =>
        set((s) => ({
          tickets: [{ id: uid('ticket'), subject, status: 'open', date: new Date().toISOString() }, ...s.tickets],
        })),
    }),
    { name: 'meridian-account' },
  ),
)
