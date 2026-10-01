import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import AuthLabel from '../../components/AuthLabel'
import { Button, Card, Input } from '../../components/ui'
import { useAuth } from '../../store/auth'

export default function ForgotPassword() {
  const { busy, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const err = await resetPassword(email)
    if (err) {
      setError(err)
      return
    }
    setSent(true)
  }

  return (
    <Page title="Reset password" intro="We'll email you a link to set a new password.">
      <div className="mx-auto mt-8 max-w-md">
        <Card>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-ink dark:text-paper">
                If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset link
                is on its way. It expires in 1 hour.
              </p>
              <p className="text-sm text-muted">
                <Link to="/login" className="font-medium text-[var(--color-accent)] hover:underline">
                  Back to log in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-ink dark:text-paper">
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
              <p className="text-center text-sm text-muted">
                <Link to="/login" className="font-medium text-[var(--color-accent)] hover:underline">
                  Back to log in
                </Link>
              </p>
            </form>
          )}
        </Card>
        <AuthLabel />
      </div>
    </Page>
  )
}
