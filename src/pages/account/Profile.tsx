import { useState } from 'react'
import { Page } from '../../components/layout'
import { Button, Card, Field, Input, Stat } from '../../components/ui'
import { useAccount } from '../../store/account'
import { useUI } from '../../store/ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Profile() {
  const { name, email, updateProfile } = useAccount()
  const { pushToast } = useUI()

  const [nameInput, setNameInput] = useState(name)
  const [emailInput, setEmailInput] = useState(email)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  function submit() {
    const next: typeof errors = {}
    if (!nameInput.trim()) next.name = 'Enter your name.'
    if (!emailInput.trim()) next.email = 'Enter your email address.'
    else if (!EMAIL_RE.test(emailInput.trim())) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    updateProfile(nameInput.trim(), emailInput.trim())
    pushToast('Profile updated', 'Your demo profile was saved.')
  }

  return (
    <Page title="Profile" intro="Manage the details on your demo account. All money is simulated." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="space-y-4">
            <Field label="Name" htmlFor="profile-name" error={errors.name}>
              <Input
                id="profile-name"
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email" htmlFor="profile-email" error={errors.email}>
              <Input
                id="profile-email"
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
                placeholder="you@example.com"
              />
            </Field>
            <div className="flex justify-end">
              <Button onClick={submit}>Save changes</Button>
            </div>
          </div>
        </Card>
        <div>
          <Card>
            <Stat label="Current name" value={name} />
            <div className="mt-4">
              <Stat label="Current email" value={email} />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
