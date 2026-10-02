import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout'
import { Badge, Button, Card, Field, Input, Select, Stat } from '../../components/ui'
import { useWallet } from '../../store/wallet'
import { useDeposits, DEPOSIT_EXPIRE_AFTER_MS, DEPOSIT_REQUIRED_CONFIRMATIONS, type DepositIntent, type DepositStatus } from '../../store/deposits'
import { useUI } from '../../store/ui'
import { formatQty } from '../../lib/market'
import {
  CRYPTO_NETWORKS,
  DEPOSIT_ASSETS,
  SAMPLE_DEPOSIT_ADDRESS,
  shortAddress,
  type DepositAsset,
} from '../../lib/crypto'

const STEPS = ['Amount', 'Network', 'Review']

function statusTone(s: DepositStatus): 'accent' | 'green' | 'red' | 'neutral' {
  switch (s) {
    case 'awaiting': return 'accent'
    case 'confirming': return 'accent'
    case 'pending-clearance': return 'accent'
    case 'cleared': return 'green'
    case 'rejected': return 'red'
    case 'expired':
    case 'cancelled': return 'neutral'
    default: return 'neutral'
  }
}

function statusLabel(d: DepositIntent): string {
  switch (d.status) {
    case 'awaiting': return 'Awaiting deposit'
    case 'confirming': return `Confirming ${d.confirmations}/${d.requiredConfirmations}`
    case 'pending-clearance': return 'Pending admin clearance'
    case 'cleared': return 'Cleared'
    case 'rejected': return 'Rejected'
    case 'expired': return 'Expired'
    case 'cancelled': return 'Cancelled'
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Live countdown text for an awaiting intent. */
function useExpiryCountdown(intent: DepositIntent | undefined): string | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!intent || intent.status !== 'awaiting') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [intent])
  if (!intent || intent.status !== 'awaiting') return null
  const left = DEPOSIT_EXPIRE_AFTER_MS - (now - new Date(intent.createdAt).getTime())
  if (left <= 0) return 'expiring…'
  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

function DepositTracker({ intentId, onNew }: { intentId: string; onNew: () => void }) {
  const intent = useDeposits((s) => s.deposits.find((d) => d.id === intentId))
  const cancelDeposit = useDeposits((s) => s.cancelDeposit)
  const countdown = useExpiryCountdown(intent)

  if (!intent) return null
  const fmt = (n: number) => `${formatQty(n)} ${intent.asset}`
  const cleared = intent.status === 'cleared'
  const stages: Array<{ key: string; label: string; done: boolean; active: boolean }> = [
    { key: 'awaiting', label: 'Awaiting deposit', done: true, active: intent.status === 'awaiting' },
    {
      key: 'confirming',
      label: intent.status === 'confirming' ? `Confirming ${intent.confirmations}/${intent.requiredConfirmations}` : 'Network confirmations',
      done: intent.status === 'pending-clearance' || cleared,
      active: intent.status === 'confirming',
    },
    {
      key: 'clearance',
      label: 'Admin clearance',
      done: cleared,
      active: intent.status === 'pending-clearance',
    },
    { key: 'cleared', label: 'Cleared', done: cleared, active: false },
  ]

  return (
    <Card className="max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-ink dark:text-paper">Deposit {statusLabel(intent).toLowerCase()}</p>
        <Badge tone={statusTone(intent.status)}>{statusLabel(intent)}</Badge>
      </div>

      <ol className="mt-5 space-y-0">
        {stages.map((st, i) => (
          <li key={st.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < stages.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-6 left-[11px] h-[calc(100%-1.25rem)] w-0.5 ${st.done ? 'bg-[var(--color-accent)]' : 'bg-line dark:bg-[#2a2a2d]'}`}
              />
            )}
            <span
              className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                st.done
                  ? 'bg-[var(--color-accent)] text-white'
                  : st.active
                    ? 'border-2 border-[var(--color-accent)] bg-paper dark:bg-ink'
                    : 'bg-mist text-muted dark:bg-ink'
              }`}
            >
              {st.done ? '✓' : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-medium ${st.active || st.done ? 'text-ink dark:text-paper' : 'text-muted'}`}>{st.label}</p>
              {st.key === 'awaiting' && intent.status === 'awaiting' && countdown && (
                <p className="mt-0.5 text-xs text-muted">Send {fmt(intent.amount)} to the address below. Expires in {countdown}.</p>
              )}
              {st.key === 'confirming' && intent.status === 'confirming' && (
                <p className="mt-0.5 text-xs text-muted">Detected on network. It moves to admin clearance at {intent.requiredConfirmations} confirmations.</p>
              )}
              {st.key === 'clearance' && intent.status === 'pending-clearance' && (
                <p className="mt-0.5 text-xs text-muted">Confirmed on network. Your balance credits once an admin clears the deposit.</p>
              )}
              {st.key === 'cleared' && cleared && (
                <p className="mt-0.5 text-xs text-muted">{fmt(intent.amount)} added to your {intent.asset} balance.</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {(intent.status === 'awaiting' || intent.status === 'confirming') && (
        <div className="mt-5 rounded-xl border border-line bg-mist p-4 dark:border-[#2a2a2d] dark:bg-ink">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Deposit address · {intent.network.replace(' (simulated)', '')}</p>
          <p className="mt-2 font-mono text-sm break-all text-ink dark:text-paper">{intent.address}</p>
          <p className="mt-2 text-xs text-muted">Sample address — do not send real funds.</p>
        </div>
      )}

      {intent.status === 'expired' && (
        <p className="mt-4 text-sm text-muted">This address expired before a deposit was detected. Create a new deposit to try again.</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {(intent.status === 'awaiting' || intent.status === 'confirming' || intent.status === 'pending-clearance') && (
          <Button variant="secondary" onClick={() => cancelDeposit(intent.id)}>Cancel deposit</Button>
        )}
        {(intent.status === 'cleared' || intent.status === 'rejected' || intent.status === 'expired' || intent.status === 'cancelled') && (
          <Button variant="secondary" onClick={onNew}>New deposit</Button>
        )}
        {intent.status === 'cleared' && <Button to="/wallet/history">View history</Button>}
        {intent.status === 'rejected' && (
          <p className="mt-4 text-sm text-muted">This deposit was rejected by an admin. Create a new deposit to try again.</p>
        )}
      </div>
    </Card>
  )
}

function RecentDeposits() {
  const deposits = useDeposits((s) => s.deposits)
  if (deposits.length === 0) return null
  return (
    <Card className="mt-6">
      <h3 className="text-base font-semibold text-ink dark:text-paper">Recent deposits</h3>
      <ul className="mt-3 divide-y divide-line dark:divide-[#2a2a2d]">
        {deposits.slice(0, 8).map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink dark:text-paper">
                {formatQty(d.amount)} {d.asset}
                <span className="ml-2 font-normal text-muted">{shortAddress(d.address)}</span>
              </p>
              <p className="text-xs text-muted">{fmtDate(d.createdAt)} · {d.network.replace(' (simulated)', '')}</p>
            </div>
            <Badge tone={statusTone(d.status)}>{statusLabel(d)}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function Deposit() {
  const { balances, frozen } = useWallet()
  const createDeposit = useDeposits((s) => s.createDeposit)
  const { pushToast } = useUI()

  const [step, setStep] = useState(1)
  const [asset, setAsset] = useState<DepositAsset>('BTC')
  const [amountStr, setAmountStr] = useState('')
  const [network, setNetwork] = useState(CRYPTO_NETWORKS.BTC[0])
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const amount = Number(amountStr)
  const balance = balances[asset] ?? 0
  const fmt = (n: number) => `${formatQty(n)} ${asset}`
  const address = SAMPLE_DEPOSIT_ADDRESS[network] ?? ''

  function pickAsset(a: DepositAsset) {
    setAsset(a)
    setNetwork(CRYPTO_NETWORKS[a][0])
    setError('')
    setCopied(false)
  }

  function nextFromStep1() {
    if (!amountStr || Number.isNaN(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    setError('')
    setStep(2)
  }

  function copyAddress() {
    const clip = navigator.clipboard
    if (!clip) return
    void clip.writeText(address).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  function confirm() {
    if (frozen) {
      setError('Transactions are frozen on this account. Contact support to unfreeze.')
      return
    }
    const id = createDeposit({ asset, network, amount, address })
    pushToast('Deposit initiated (simulated)', `Send ${fmt(amount)} to the ${asset} address.`)
    setActiveId(id)
  }

  function startNew() {
    setActiveId(null)
    setStep(1)
    setAmountStr('')
    setError('')
    setCopied(false)
  }

  return (
    <Page title="Deposit" intro="Add simulated crypto to your Meridian wallet. All money is simulated." disclaimer>
      {frozen && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" role="alert">
          Transactions are frozen on this account. You can view balances, but deposits are disabled until support unfreezes the account.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {activeId ? (
            <DepositTracker intentId={activeId} onNew={startNew} />
          ) : (
            <Card>
              <ol className="mb-6 flex gap-2" aria-label="Deposit steps">
                {STEPS.map((label, i) => {
                  const n = i + 1
                  const active = step === n
                  const doneStep = step > n
                  return (
                    <li key={label} className="flex flex-1 items-center gap-2">
                      <span
                        aria-current={active ? 'step' : undefined}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          doneStep || active
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-mist dark:bg-ink text-muted'
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
                  <Field label="Asset" htmlFor="deposit-asset">
                    <Select
                      id="deposit-asset"
                      value={asset}
                      onChange={(e) => pickAsset(e.target.value as DepositAsset)}
                    >
                      {DEPOSIT_ASSETS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Amount" htmlFor="deposit-amount" error={error}>
                    <Input
                      id="deposit-amount"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amountStr}
                      onChange={(e) => { setAmountStr(e.target.value); setError('') }}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button onClick={nextFromStep1}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Field label="Network" htmlFor="deposit-network">
                    <Select
                      id="deposit-network"
                      value={network}
                      onChange={(e) => { setNetwork(e.target.value); setCopied(false) }}
                    >
                      {CRYPTO_NETWORKS[asset].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                  </Field>
                  <div className="rounded-xl border border-line bg-mist p-4 dark:border-[#2a2a2d] dark:bg-ink">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">Your {asset} deposit address</p>
                    <p className="mt-2 font-mono text-sm break-all text-ink dark:text-paper">{address}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Button variant="secondary" onClick={copyAddress}>
                        {copied ? 'Copied' : 'Copy address'}
                      </Button>
                      <p className="text-xs text-muted">Sample address — do not send real funds.</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted">Simulated deposit. No real transfer happens.</p>
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Asset</dt><dd className="font-medium text-ink dark:text-paper">{asset}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Amount</dt><dd className="font-medium text-ink dark:text-paper">{fmt(amount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Network</dt><dd className="font-medium text-ink dark:text-paper">{network}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Address</dt><dd className="font-mono font-medium text-ink dark:text-paper">{shortAddress(address)}</dd></div>
                  </dl>
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={confirm}>I've sent the deposit</Button>
                  </div>
                </div>
              )}
            </Card>
          )}
          <RecentDeposits />
        </div>

        <div>
          <Card>
            <Stat label={`Current ${asset} balance`} value={fmt(balance)} />
          </Card>
          <p className="mt-3 text-xs text-muted">
            Deposits credit after {DEPOSIT_REQUIRED_CONFIRMATIONS} network confirmations. <Link to="/wallet/history" className="text-[var(--color-accent)] hover:underline">View history</Link>
          </p>
        </div>
      </div>
    </Page>
  )
}
