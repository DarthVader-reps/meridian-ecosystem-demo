import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout'
import AuthLabel from '../../components/AuthLabel'
import { Button, Card, Input } from '../../components/ui'
import { useAuth } from '../../store/auth'

export default function Signup() {
  const { user, initialized, busy, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (initialized && user) return <Navigate to="/dashboard" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const err = await signUp(name, email, password)
    if (err) {
      setError(err)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <Page title="Create your account" intro="Join Meridian and start exploring with simulated funds.">
      <div className="mx-auto mt-8 max-w-md">
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-ink dark:text-paper">Full name</label>
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-ink dark:text-paper">Email</label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-ink dark:text-paper">Password</label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted">
            Already have an account? <Link to="/login" className="font-medium text-[var(--color-accent)] hover:underline">Log in</Link>
          </p>
        </Card>
        <AuthLabel suffix="No real money involved." />
      </div>
    </Page>
  )
}
