import { useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, EmptyState, Field, Input, Textarea } from '../../components/ui'
import { useAccount } from '../../store/account'
import { useUI } from '../../store/ui'
import { timeAgo } from '../../lib/market'

// Inline mirror of src/mock/faqs.json (typed for tsconfig without resolveJsonModule)
const faqs: { q: string; x: string }[] = [
  { q: 'Is this real money?', x: 'No. Everything is simulated with mock data for demonstration. No real funds move.' },
  { q: 'Can I lose money?', x: 'No. Balances, trades, and returns are simulated in your browser only.' },
  { q: 'How do deposits work?', x: 'Deposits are multi-step simulated forms. They update your balance instantly and are stored locally.' },
  { q: 'Are the returns shown real?', x: 'No. Return ranges are illustrative examples, not predictions or guarantees.' },
  { q: 'Is my identity verified for real?', x: 'No. Verification is a simulated walkthrough. Nothing is uploaded or stored on a server.' },
  { q: 'Can I connect a real wallet?', x: 'No. Wallet connection opens a simulated dialog only. No real blockchain calls are made.' },
]

export default function Support() {
  const { tickets, addTicket } = useAccount()
  const { pushToast } = useUI()

  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({})

  const filtered = faqs.filter((f) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return f.q.toLowerCase().includes(q) || f.x.toLowerCase().includes(q)
  })

  function submitTicket() {
    const e: typeof errors = {}
    if (!subject.trim()) e.subject = 'Enter a subject.'
    if (!message.trim()) e.message = 'Describe your question.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    addTicket(subject.trim())
    setSubject('')
    setMessage('')
    pushToast('Ticket submitted (simulated)', 'Our support team will respond soon.')
  }

  return (
    <Page title="Support" intro="Answers and a simulated help desk. All money is simulated." disclaimer>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <Field label="Search FAQs" htmlFor="support-search">
              <Input
                id="support-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Is this real money?"
              />
            </Field>
            <div className="mt-4 space-y-2">
              {filtered.length === 0 && (
                <p className="text-sm text-muted">No FAQs match your search.</p>
              )}
              {filtered.map((f, i) => (
                <details
                  key={i}
                  className="rounded-xl border border-line dark:border-[#2a2a2d] px-4 py-3"
                >
                  <summary className="cursor-pointer text-sm font-medium text-ink dark:text-paper">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm text-muted">{f.x}</p>
                </details>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <p className="text-base font-semibold text-ink dark:text-paper">Open a ticket</p>
            <div className="mt-4 space-y-4">
              <Field label="Subject" htmlFor="ticket-subject" error={errors.subject}>
                <Input
                  id="ticket-subject"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setErrors((p) => ({ ...p, subject: undefined })) }}
                  placeholder="What do you need help with?"
                />
              </Field>
              <Field label="Message" htmlFor="ticket-message" error={errors.message}>
                <Textarea
                  id="ticket-message"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: undefined })) }}
                  placeholder="Describe your question."
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={submitTicket}>Submit ticket</Button>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-base font-semibold text-ink dark:text-paper">Your tickets</p>
            <div className="mt-4">
              {tickets.length === 0 ? (
                <EmptyState
                  title="No tickets yet"
                  body="Your simulated support tickets will appear here."
                />
              ) : (
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-line dark:border-[#2a2a2d] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-paper">{t.subject}</p>
                        <p className="text-xs text-muted">{timeAgo(t.date)}</p>
                      </div>
                      <Badge tone={t.status === 'open' ? 'amber' : 'green'}>
                        {t.status === 'open' ? 'Open' : 'Answered'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
