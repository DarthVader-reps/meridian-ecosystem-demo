import { useState } from 'react'
import { Page } from '../../components/layout'
import { Button, Card, Field, Input, Select, Stat } from '../../components/ui'
import { useWallet } from '../../store/wallet'
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

export default function Deposit() {
  const { balances, deposit, frozen } = useWallet()
  const { pushToast } = useUI()

  const [step, setStep] = useState(1)
  const [asset, setAsset] = useState<DepositAsset>('BTC')
  const [amountStr, setAmountStr] = useState('')
  const [network, setNetwork] = useState(CRYPTO_NETWORKS.BTC[0])
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
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
    const ok = deposit(asset, amount, `Deposit via ${network}`)
    if (!ok) {
      setError('Deposit failed. Check the amount and try again.')
      return
    }
    pushToast('Deposit complete (simulated)', `${fmt(amount)} added to your ${asset} balance.`)
    setDone(true)
  }

  if (done) {
    return (
      <Page title="Deposit" intro="Add simulated crypto to your Meridian wallet. All money is simulated." disclaimer>
        <Card className="max-w-xl">
          <p className="text-lg font-semibold text-ink dark:text-paper">Deposit complete</p>
          <p className="mt-1 text-sm text-muted">This was simulated. No real crypto moved.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Asset</dt><dd className="font-medium text-ink dark:text-paper">{asset}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Amount</dt><dd className="font-medium text-ink dark:text-paper">{fmt(amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Network</dt><dd className="font-medium text-ink dark:text-paper">{network}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">New {asset} balance</dt><dd className="font-medium text-ink dark:text-paper">{fmt(balance)}</dd></div>
          </dl>
          <div className="mt-6">
            <Button to="/wallet/history">View history</Button>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page title="Deposit" intro="Add simulated crypto to your Meridian wallet. All money is simulated." disclaimer>
      {frozen && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" role="alert">
          Transactions are frozen on this account. You can view balances, but deposits are disabled until support unfreezes the account.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
                <Button onClick={confirm}>Confirm deposit</Button>
              </div>
            </div>
          )}
        </Card>

        <div>
          <Card>
            <Stat label={`Current ${asset} balance`} value={fmt(balance)} />
          </Card>
        </div>
      </div>
    </Page>
  )
}
