import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin, ADMIN_PIN } from '../../store/admin'
import { Button, Card, Field, Input, SectionHeader } from '../../components/ui'

export default function AdminGate() {
  const { login } = useAdmin()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(pin)) {
      navigate('/admin', { replace: true })
    } else {
      setError('Incorrect PIN. Try again.')
      setPin('')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <SectionHeader
        eyebrow="Restricted"
        title="Admin console"
        body="Enter the demo admin PIN to manage users, content, and platform settings."
      />
      <Card className="mt-8">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Admin PIN" error={error} htmlFor="admin-pin">
            <Input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoComplete="off"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pin.length < 4}>
            Unlock console
          </Button>
          <p className="text-center text-xs text-muted">
            Demo PIN is <span className="font-mono font-semibold">{ADMIN_PIN}</span>
          </p>
        </form>
      </Card>
      <p className="mt-6 text-center text-xs text-muted">
        This is a front-end demo. Admin actions modify simulated data in your browser only.
      </p>
    </div>
  )
}
