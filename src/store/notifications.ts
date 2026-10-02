import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'
import { useUI } from './ui'

export type NotifyKind = 'info' | 'success' | 'warning' | 'error'
export type NotifyChannel = 'inapp' | 'email'

export interface Notification {
  id: string
  title: string
  body?: string
  kind: NotifyKind
  channels: NotifyChannel[]
  /** Email delivery state — see dispatchEmail seam below. */
  email: 'sent' | 'not-configured' | 'not-requested'
  link?: string
  read: boolean
  createdAt: string
}

export interface NotifyInput {
  title: string
  body?: string
  kind?: NotifyKind
  /** Default ['inapp']. Include 'email' to also route to the email seam. */
  channels?: NotifyChannel[]
  link?: string
  /** Fire an ephemeral toast as well. Default true. */
  toast?: boolean
}

/**
 * EMAIL SEAM — wire real delivery here.
 * Today there is no backend mailer, so the email channel is a documented
 * no-op: the notification is kept in-app and flagged 'not-configured'.
 * To go live: POST { to, subject, body } to a Supabase Edge Function
 * (or Resend/Postmark) and set email: 'sent' on success.
 */
async function dispatchEmail(n: Notification): Promise<'sent' | 'not-configured'> {
  console.info('[notifications] email channel not configured — kept in-app only', n.id, n.title)
  return 'not-configured'
}

interface NotificationsState {
  notifications: Notification[]
  notify: (input: NotifyInput) => string
  markRead: (id: string) => void
  markAllRead: () => void
  clearRead: () => void
  unreadCount: () => number
}

const MAX_KEPT = 50

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],

      notify: (input) => {
        const id = uid('ntf')
        const channels = input.channels ?? ['inapp']
        const n: Notification = {
          id,
          title: input.title,
          body: input.body,
          kind: input.kind ?? 'info',
          channels,
          email: channels.includes('email') ? 'not-configured' : 'not-requested',
          link: input.link,
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ notifications: [n, ...s.notifications].slice(0, MAX_KEPT) }))
        if (channels.includes('email')) {
          void dispatchEmail(n).then((email) => {
            set((s) => ({
              notifications: s.notifications.map((x) => (x.id === id ? { ...x, email } : x)),
            }))
          })
        }
        if (input.toast !== false) {
          useUI.getState().pushToast(n.title, n.body)
        }
        return id
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      clearRead: () => set((s) => ({ notifications: s.notifications.filter((n) => !n.read) })),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: 'meridian-notifications' },
  ),
)
