import { useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, Field, Input, Select } from '../../components/ui'
import { useAccount } from '../../store/account'
import { useUI } from '../../store/ui'
import type { VerificationStatus } from '../../store/account'

const STEPS = ['Personal info', 'Document', 'Review']

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Other']

const DOCUMENTS = ['Passport (simulated)', 'ID card (simulated)', 'Driver licence (simulated)']

const STATUS_TONE: Record<VerificationStatus, 'neutral' | 'amber' | 'green' | 'red'> = {
  unverified: 'neutral',
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  unverified: 'Unverified',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function Verify() {
  const { name, verification, setVerification } = useAccount()
  const { pushToast } = useUI()

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState(name)
  const [country, setCountry] = useState(COUNTRIES[0])
  const [document, setDocument] = useState(DOCUMENTS[0])
  const [error, setError] = useState('')

  function nextFromStep1() {
    if (!fullName.trim()) {
      setError('Enter your full name.')
      return
    }
    setError('')
    setStep(2)
  }

  function submit() {
    setVerification('pending')
    pushToast('Verification submitted (simulated)', 'Your identity is under simulated review.')
  }

  return (
    <Page title="Verify identity" intro="A simulated identity check. Nothing is uploaded or stored on a server." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {(verification === 'unverified' || verification === 'rejected') && (
            <Card>
              <ol className="mb-6 flex gap-2" aria-label="Verification steps">
                {STEPS.map((label, i) => {
                  const n = i + 1
                  const active = step === n
                  return (
                    <li key={label} className="flex flex-1 items-center gap-2">
                      <span
                        aria-current={active ? 'step' : undefined}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          active || step > n ? 'bg-[var(--color-accent)] text-white' : 'bg-mist dark:bg-ink text-muted'
                        }`}
                      >
                        {n}
                      </span>
                      <span className={`text-sm ${active ? 'font-semibold text-ink dark:text-paper' : 'text-muted'}`}>{label}</span>
                    </li>
                  )
                })}
              </ol>

              {step === 1 && (
                <div className="space-y-4">
                  <Field label="Full name" htmlFor="verify-name" error={error}>
                    <Input
                      id="verify-name"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError('') }}
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field label="Country" htmlFor="verify-country">
                    <Select id="verify-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <div className="flex justify-end">
                    <Button onClick={nextFromStep1}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Field label="Document type" htmlFor="verify-document">
                    <Select id="verify-document" value={document} onChange={(e) => setDocument(e.target.value)}>
                      {DOCUMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  </Field>
                  <p className="text-sm text-muted">No real file upload — this step is simulated.</p>
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Full name</dt><dd className="font-medium text-ink dark:text-paper">{fullName}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Country</dt><dd className="font-medium text-ink dark:text-paper">{country}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Document</dt><dd className="font-medium text-ink dark:text-paper">{document}</dd></div>
                  </dl>
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={submit}>Submit</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {verification === 'pending' && (
            <Card>
              <p className="text-lg font-semibold text-ink dark:text-paper">Verification pending</p>
              <p className="mt-1 text-sm text-muted">Your submission is under simulated review.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setVerification('approved'); pushToast('Verification approved (simulated)', 'Identity marked as approved.') }}>
                  Simulate approval
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setVerification('rejected'); pushToast('Verification rejected (simulated)', 'Identity marked as rejected.') }}>
                  Simulate rejection
                </Button>
              </div>
            </Card>
          )}

          {verification === 'approved' && (
            <Card>
              <p className="text-lg font-semibold text-ink dark:text-paper">Identity verified</p>
              <p className="mt-1 text-sm text-muted">Your identity passed the simulated check.</p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => { setVerification('unverified'); setStep(1) }}>
                  Restart verification
                </Button>
              </div>
            </Card>
          )}

          {verification === 'rejected' && (
            <p className="text-sm text-muted">Your last submission was rejected in the simulation. You can start over below.</p>
          )}
        </div>

        <div>
          <Card>
            <p className="text-sm text-muted">Verification status</p>
            <div className="mt-2">
              <Badge tone={STATUS_TONE[verification]}>{STATUS_LABEL[verification]}</Badge>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
