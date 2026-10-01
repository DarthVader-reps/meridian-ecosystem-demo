import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import AuthLabel from '../../components/AuthLabel'
import { Button, Card, Input } from '../../components/ui'
import { isSupabaseConfigured } from '../../config/supabase'
import { parseRecoveryTokens, supabase } from '../../lib/supabase'

type Stage = 'checking' | 'ready' | 'invalid' | 'done'

export default function ResetPassword() {
  const [stage, setStage] = useState<Stage>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStage('invalid')
      return
    }
    const tokens = parseRecoveryTokens(window.location.hash)
    if (!tokens) {
      setStage('invalid')
      return
    }
    let cancelled = false
    supabase.auth.setSession(tokens).then(({ error: sessionError }) => {
      if (!cancelled) setStage(sessionError ? 'invalid' : 'ready')
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!supabase) {
      setError('Password reset is unavailable.')
      return
    }
    setBusy(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setBusy(false)
      setError(updateError.message)
      return
    }
    // Drop the recovery session — the user logs in fresh with the new password.
    await supabase.auth.signOut()
    setBusy(false)
    setStage('done')
  }

  return (
    <Page title="Set a new password" intro="Choose a new password for your Meridian account.">
      <div className="mx-auto mt-8 max-w-md">
        <Card>
          {stage === 'checking' && (
            <p className="py-6 text-center text-sm text-muted">Verifying your reset link…</p>
          )}
          {stage === 'invalid' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink dark:text-paper">
                This reset link is invalid or has expired.
              </p>
              <p className="text-sm text-muted">
                <Link to="/forgot-password" className="font-medium text-[var(--color-accent)] hover:underline">
                  Request a new link
                </Link>
              </p>
            </div>
          )}
          {stage === 'ready' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-ink dark:text-paper">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-ink dark:text-paper">
                  Confirm password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Saving…' : 'Set new password'}
              </Button>
            </form>
          )}
          {stage === 'done' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink dark:text-paper">
                Your password has been updated. Log in with your new password.
              </p>
              <p className="text-sm text-muted">
                <Link to="/login" className="font-medium text-[var(--color-accent)] hover:underline">
                  Go to log in
                </Link>
              </p>
            </div>
          )}
        </Card>
        <AuthLabel />
      </div>
    </Page>
  )
}
