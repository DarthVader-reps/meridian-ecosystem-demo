import { useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, Field, Input, Toggle } from '../../components/ui'
import { useAccount } from '../../store/account'
import { useUI } from '../../store/ui'

interface Session {
  id: string
  device: string
  location: string
  current: boolean
}

const INITIAL_SESSIONS: Session[] = [
  { id: 's-1', device: 'Chrome on macOS', location: 'New York, US', current: true },
  { id: 's-2', device: 'Safari on iPhone', location: 'New York, US', current: false },
]

export default function Security() {
  const { twoFA, toggle2FA } = useAccount()
  const { pushToast } = useUI()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmNext, setConfirmNext] = useState('')
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({})
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)

  function handle2FA() {
    toggle2FA()
    pushToast(
      twoFA ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled',
      'Simulated security setting.',
    )
  }

  function updatePassword() {
    const e: typeof errors = {}
    if (!current) e.current = 'Enter your current password.'
    if (next.length < 8) e.next = 'New password must be at least 8 characters.'
    if (confirmNext !== next) e.confirm = 'Passwords do not match.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setCurrent('')
    setNext('')
    setConfirmNext('')
    pushToast('Password updated (simulated)', 'Your demo password was changed.')
  }

  function revoke(id: string) {
    setSessions((s) => s.filter((sess) => sess.id !== id))
    pushToast('Session revoked (simulated)', 'The device session was signed out.')
  }

  return (
    <Page title="Security" intro="Manage authentication and sessions for your demo account. All money is simulated." disclaimer>
      <div className="max-w-2xl space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink dark:text-paper">Two-factor authentication</p>
              <p className="mt-1 text-sm text-muted">Adds a simulated second step when signing in.</p>
            </div>
            <Toggle checked={twoFA} onChange={handle2FA} label="Two-factor authentication" />
          </div>
        </Card>

        <Card>
          <p className="text-base font-semibold text-ink dark:text-paper">Change password</p>
          <div className="mt-4 space-y-4">
            <Field label="Current password" htmlFor="sec-current" error={errors.current}>
              <Input
                id="sec-current"
                type="password"
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setErrors((p) => ({ ...p, current: undefined })) }}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" htmlFor="sec-new" error={errors.next}>
              <Input
                id="sec-new"
                type="password"
                value={next}
                onChange={(e) => { setNext(e.target.value); setErrors((p) => ({ ...p, next: undefined })) }}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password" htmlFor="sec-confirm" error={errors.confirm}>
              <Input
                id="sec-confirm"
                type="password"
                value={confirmNext}
                onChange={(e) => { setConfirmNext(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })) }}
                autoComplete="new-password"
              />
            </Field>
            <div className="flex justify-end">
              <Button onClick={updatePassword}>Update password</Button>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-base font-semibold text-ink dark:text-paper">Active sessions</p>
          <ul className="mt-4 space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line dark:border-[#2a2a2d] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink dark:text-paper">{s.device}</p>
                  <p className="text-xs text-muted">{s.location}</p>
                </div>
                {s.current ? (
                  <Badge tone="green">Current</Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => revoke(s.id)}>Revoke</Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  )
}
