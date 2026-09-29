import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'

export interface Toast {
  id: string
  title: string
  message?: string
}

interface UIState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  toasts: Toast[]
  pushToast: (title: string, message?: string) => void
  dismissToast: (id: string) => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toasts: [],
      pushToast: (title, message) =>
        set((s) => ({ toasts: [...s.toasts, { id: uid('toast'), title, message }].slice(-4) })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    { name: 'meridian-ui', partialize: (s) => ({ theme: s.theme }) as UIState },
  ),
)
