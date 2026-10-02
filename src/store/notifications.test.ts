import { beforeEach, describe, expect, it } from 'vitest'
import { useNotifications } from './notifications'
import { useUI } from './ui'

describe('notifications store', () => {
  beforeEach(() => {
    useNotifications.setState({ notifications: [] })
  })

  it('persists a notification and fires a toast by default', () => {
    const id = useNotifications.getState().notify({ title: 'Hello', body: 'World', kind: 'success' })
    const n = useNotifications.getState().notifications[0]
    expect(n.id).toBe(id)
    expect(n.title).toBe('Hello')
    expect(n.read).toBe(false)
    expect(n.email).toBe('not-requested')
    expect(useUI.getState().toasts.some((t) => t.title === 'Hello')).toBe(true)
    expect(useNotifications.getState().unreadCount()).toBe(1)
  })

  it('marks the email channel as not-configured (seam documented, no silent send)', async () => {
    useNotifications.getState().notify({ title: 'Mail me', channels: ['inapp', 'email'], toast: false })
    // dispatchEmail resolves async; flush a microtask
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    const n = useNotifications.getState().notifications[0]
    expect(n.email).toBe('not-configured')
  })

  it('markRead / markAllRead / clearRead behave', () => {
    const s = useNotifications.getState()
    const a = s.notify({ title: 'A', toast: false })
    s.notify({ title: 'B', toast: false })
    expect(useNotifications.getState().unreadCount()).toBe(2)
    useNotifications.getState().markRead(a)
    expect(useNotifications.getState().unreadCount()).toBe(1)
    useNotifications.getState().markAllRead()
    expect(useNotifications.getState().unreadCount()).toBe(0)
    useNotifications.getState().clearRead()
    expect(useNotifications.getState().notifications).toHaveLength(0)
  })
})
