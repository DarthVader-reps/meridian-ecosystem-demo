import { useState } from 'react'
import { Page } from '../../components/layout'
import { Button, Card, Field, Input, Modal, Select, Stat } from '../../components/ui'
import { useWallet } from '../../store/wallet'
import { useUI } from '../../store/ui'
import { formatMoney, formatQty } from '../../lib/market'

const RATES: Record<string, number> = {
  'USD->BTC': 0.0000103,
  'USD->ETH': 0.00026,
  'BTC->USD': 97412,
  'ETH->USD': 3841,
  'BTC->ETH': 25.4,
  'ETH->BTC': 0.039,
}

const RATE_OPTIONS = [
  { id: 'market', label: 'Market rate (simulated)' },
  { id: 'fixed', label: 'Fixed mid rate (simulated)' },
]

export default function Swap() {
  const { balances, swap, frozen } = useWallet()
  const { pushToast } = useUI()
  const assets = Array.from(new Set(['USD', 'BTC', 'ETH', ...Object.keys(balances)]))

  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('BTC')
  const [amountStr, setAmountStr] = useState('')
  const [rateId, setRateId] = useState('market')
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone] = useState(false)

  const amount = Number(amountStr)
  const fromBalance = balances[from] ?? 0
  const baseRate = RATES[`${from}->${to}`] ?? 1
  const rate = rateId === 'fixed' ? baseRate * 0.995 : baseRate
  const received = !Number.isNaN(amount) && amount > 0 ? amount * rate : 0

  const fmtAsset = (asset: string, n: number) =>
    asset === 'USD' ? formatMoney(n) : `${formatQty(n)} ${asset}`

  function openConfirm() {
    if (from === to) {
      setError('Choose two different assets.')
      return
    }
    if (!amountStr || Number.isNaN(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (amount > fromBalance) {
      setError('Insufficient simulated balance.')
      return
    }
    setError('')
    setConfirmOpen(true)
  }

  function confirm() {
    if (frozen) {
      setConfirmOpen(false)
      setError('Transactions are frozen on this account. Contact support to unfreeze.')
      return
    }
    const ok = swap(from, to, amount, rate)
    setConfirmOpen(false)
    if (!ok) {
      setError('Swap failed. Check the amount and try again.')
      return
    }
    pushToast('Swap complete (simulated)', `${fmtAsset(from, amount)} swapped to ${fmtAsset(to, received)}.`)
    setDone(true)
  }

  if (done) {
    return (
      <Page title="Swap" intro="Exchange one simulated asset for another at a simulated rate. All money is simulated." disclaimer>
        <Card className="max-w-xl">
          <p className="text-lg font-semibold text-ink dark:text-paper">Swap complete</p>
          <p className="mt-1 text-sm text-muted">This was simulated. No real money moved.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">You swapped</dt><dd className="font-medium text-ink dark:text-paper">{fmtAsset(from, amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">You received</dt><dd className="font-medium text-ink dark:text-paper">{fmtAsset(to, received)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Rate</dt><dd className="font-medium text-ink dark:text-paper">{formatQty(rate)}</dd></div>
          </dl>
          <div className="mt-6">
            <Button to="/wallet/history">View history</Button>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page title="Swap" intro="Exchange one simulated asset for another at a simulated rate. All money is simulated." disclaimer>
      {frozen && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" role="alert">
          Transactions are frozen on this account. Swaps are disabled until support unfreezes the account.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From asset" htmlFor="swap-from">
                <Select id="swap-from" value={from} onChange={(e) => { setFrom(e.target.value); setError('') }}>
                  {assets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </Field>
              <Field label="To asset" htmlFor="swap-to">
                <Select id="swap-to" value={to} onChange={(e) => { setTo(e.target.value); setError('') }}>
                  {assets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Amount" htmlFor="swap-amount" error={error}>
              <Input
                id="swap-amount"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => { setAmountStr(e.target.value); setError('') }}
              />
            </Field>
            <Field label="Rate type" htmlFor="swap-rate">
              <Select id="swap-rate" value={rateId} onChange={(e) => setRateId(e.target.value)}>
                {RATE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <div className="rounded-xl bg-mist dark:bg-ink px-4 py-3">
              <p className="text-sm text-muted">
                You receive ≈ <span className="font-semibold text-ink dark:text-paper">{fmtAsset(to, received)}</span>
              </p>
              <p className="mt-1 text-xs text-muted">Simulated rate: 1 {from} = {formatQty(rate)} {to}.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={openConfirm}>Continue</Button>
            </div>
          </div>
        </Card>
        <div>
          <Card>
            <Stat label={`${from} balance`} value={fmtAsset(from, fromBalance)} />
          </Card>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm swap">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">You swap</dt><dd className="font-medium text-ink dark:text-paper">{fmtAsset(from, amount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">You receive</dt><dd className="font-medium text-ink dark:text-paper">{fmtAsset(to, received)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Rate</dt><dd className="font-medium text-ink dark:text-paper">{formatQty(rate)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-muted">Simulated. No real assets move.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Back</Button>
          <Button onClick={confirm}>Confirm swap</Button>
        </div>
      </Modal>
    </Page>
  )
}
