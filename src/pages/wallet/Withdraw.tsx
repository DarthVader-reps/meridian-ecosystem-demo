import { useState } from 'react'
import { Page } from '../../components/layout'
import { Button, Card, Field, Input, Select, Stat } from '../../components/ui'
import { useWallet } from '../../store/wallet'
import { useUI } from '../../store/ui'
import { formatMoney, formatQty } from '../../lib/market'

const METHODS = ['Bank transfer (simulated)', 'Crypto transfer (simulated)']

const STEPS = ['Amount', 'Method', 'Review']

export default function Withdraw() {
  const { balances, withdraw } = useWallet()
  const { pushToast } = useUI()
  const assets = Array.from(new Set(['USD', 'BTC', 'ETH', ...Object.keys(balances)]))

  const [step, setStep] = useState(1)
  const [asset, setAsset] = useState('USD')
  const [amountStr, setAmountStr] = useState('')
  const [method, setMethod] = useState(METHODS[0])
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const amount = Number(amountStr)
  const balance = balances[asset] ?? 0
  const fmt = (n: number) => (asset === 'USD' ? formatMoney(n) : `${formatQty(n)} ${asset}`)

  function validateAmount(): boolean {
    if (!amountStr || Number.isNaN(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.')
      return false
    }
    if (amount > balance) {
      setError('Insufficient simulated balance.')
      return false
    }
    setError('')
    return true
  }

  function confirm() {
    const ok = withdraw(asset, amount, `Withdraw via ${method}`)
    if (!ok) {
      setError('Insufficient simulated balance.')
      return
    }
    pushToast('Withdrawal complete (simulated)', `${fmt(amount)} removed from your ${asset} balance.`)
    setDone(true)
  }

  if (done) {
    return (
      <Page title="Withdraw" intro="Remove simulated funds from your Meridian wallet. All money is simulated." disclaimer>
        <Card className="max-w-xl">
          <p className="text-lg font-semibold text-ink dark:text-paper">Withdrawal complete</p>
          <p className="mt-1 text-sm text-muted">This was simulated. No real money moved.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Asset</dt><dd className="font-medium text-ink dark:text-paper">{asset}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Amount</dt><dd className="font-medium text-ink dark:text-paper">{fmt(amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Method</dt><dd className="font-medium text-ink dark:text-paper">{method}</dd></div>
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
    <Page title="Withdraw" intro="Remove simulated funds from your Meridian wallet. All money is simulated." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <ol className="mb-6 flex gap-2" aria-label="Withdrawal steps">
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
              <Field label="Asset" htmlFor="withdraw-asset">
                <Select
                  id="withdraw-asset"
                  value={asset}
                  onChange={(e) => { setAsset(e.target.value); setError('') }}
                >
                  {assets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount" htmlFor="withdraw-amount" error={error}>
                <Input
                  id="withdraw-amount"
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
                <Button onClick={() => { if (validateAmount()) setStep(2) }}>Continue</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Withdrawal method" htmlFor="withdraw-method">
                <Select id="withdraw-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <p className="text-sm text-muted">Simulated method. No real transfer happens.</p>
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
                <div className="flex justify-between"><dt className="text-muted">Method</dt><dd className="font-medium text-ink dark:text-paper">{method}</dd></div>
              </dl>
              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={confirm}>Confirm withdrawal</Button>
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
