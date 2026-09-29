import { useState } from 'react'
import { Page } from '../../components/layout'
import { Button, Card, Field, Input, Select, Stat } from '../../components/ui'
import { useWallet } from '../../store/wallet'
import { useUI } from '../../store/ui'
import { formatMoney, formatQty } from '../../lib/market'

export default function Transfer() {
  const { balances, transfer } = useWallet()
  const { pushToast } = useUI()
  const assets = Array.from(new Set(['USD', 'BTC', 'ETH', ...Object.keys(balances)]))

  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('BTC')
  const [amountStr, setAmountStr] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const amount = Number(amountStr)
  const fromBalance = balances[from] ?? 0
  const fmtAsset = (asset: string, n: number) =>
    asset === 'USD' ? formatMoney(n) : `${formatQty(n)} ${asset}`

  function submit() {
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
    const ok = transfer(from, to, amount)
    if (!ok) {
      setError('Transfer failed. Check the amount and try again.')
      return
    }
    setError('')
    pushToast('Transfer complete (simulated)', `${fmtAsset(from, amount)} moved from ${from} to ${to}.`)
    setDone(true)
  }

  if (done) {
    return (
      <Page title="Transfer" intro="Move simulated funds between assets in your wallet. All money is simulated." disclaimer>
        <Card className="max-w-xl">
          <p className="text-lg font-semibold text-ink dark:text-paper">Transfer complete</p>
          <p className="mt-1 text-sm text-muted">This was simulated. No real money moved.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">From</dt><dd className="font-medium text-ink dark:text-paper">{from}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">To</dt><dd className="font-medium text-ink dark:text-paper">{to}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Amount</dt><dd className="font-medium text-ink dark:text-paper">{fmtAsset(from, amount)}</dd></div>
          </dl>
          <div className="mt-6">
            <Button to="/wallet/history">View history</Button>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page title="Transfer" intro="Move simulated funds between assets in your wallet. All money is simulated." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From asset" htmlFor="transfer-from">
                <Select id="transfer-from" value={from} onChange={(e) => { setFrom(e.target.value); setError('') }}>
                  {assets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </Field>
              <Field label="To asset" htmlFor="transfer-to">
                <Select id="transfer-to" value={to} onChange={(e) => { setTo(e.target.value); setError('') }}>
                  {assets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Amount" htmlFor="transfer-amount" error={error}>
              <Input
                id="transfer-amount"
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
              <Button onClick={submit}>Confirm transfer</Button>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <Stat label={`${from} balance`} value={fmtAsset(from, fromBalance)} />
          </Card>
          <Card>
            <Stat label={`${to} balance`} value={fmtAsset(to, balances[to] ?? 0)} />
          </Card>
        </div>
      </div>
    </Page>
  )
}
