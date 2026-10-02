import { useState } from 'react'
import { Button, Card, EmptyState, Field, Input, Select, Stat, Tabs } from '../../components/ui'
import { Page } from '../../components/layout'
import { useTrading } from '../../store/trading'
import { useUI } from '../../store/ui'
import { formatMoney, formatPct, formatQty, timeAgo } from '../../lib/market'
import { LIVE_SYMBOLS, useAssets, usePricesLive } from '../../lib/assetPrices'

const round8 = (n: number) => Math.round(n * 1e8) / 1e8

function ChangePct({ value }: { value: number }) {
  return (
    <span className={value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
      {formatPct(value)}
    </span>
  )
}

export default function DemoTrading() {
  const { demoBalance, positions, orders, placeOrder } = useTrading()
  const pushToast = useUI((s) => s.pushToast)
  const assets = useAssets()
  const pricesLive = usePricesLive()
  const assetMap = new Map(assets.map((a) => [a.symbol, a]))

  const [symbol, setSymbol] = useState(assets[0].symbol)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState(String(round8(assets[0].price)))
  const [qtyError, setQtyError] = useState('')
  const [priceError, setPriceError] = useState('')

  const selected = assetMap.get(symbol)
  const qtyNum = Number(qty)
  const priceNum = Number(price)
  const total = Number.isFinite(qtyNum) && Number.isFinite(priceNum) && qtyNum > 0 && priceNum > 0 ? qtyNum * priceNum : 0

  function handleSymbolChange(v: string) {
    setSymbol(v)
    const a = assetMap.get(v)
    if (a) setPrice(String(round8(a.price)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let ok = true
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setQtyError('Quantity must be greater than zero.')
      ok = false
    } else {
      setQtyError('')
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setPriceError('Price must be greater than zero.')
      ok = false
    } else {
      setPriceError('')
    }
    if (!ok) return
    if (side === 'buy' && qtyNum * priceNum > demoBalance) {
      setQtyError('Order cost exceeds your simulated balance.')
      return
    }
    const placed = placeOrder(symbol, side, qtyNum, priceNum)
    if (placed) {
      pushToast('Order placed', `${side === 'buy' ? 'Bought' : 'Sold'} ${formatQty(qtyNum)} ${symbol} at ${formatMoney(priceNum)}.`)
      setQty('1')
    } else {
      pushToast('Order rejected', side === 'sell' ? 'Not enough quantity in your position.' : 'Insufficient simulated balance.')
    }
  }

  return (
    <Page title="Paper trading" intro="Simulated funds. BTC, ETH and SOL stream live market prices; every other quote is illustrative and moves no real market." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <Stat
              label="Practice balance"
              value={formatMoney(demoBalance)}
              sub={<span className="text-muted">Simulated funds for this account.</span>}
            />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink dark:text-paper">Positions</h2>
            {positions.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No open positions" body="Your fills will appear here once you place an order." />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-line dark:border-[#2a2a2d] text-left text-muted">
                      <th scope="col" className="py-2 pr-4 font-medium">Symbol</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Quantity</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Avg price</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Current</th>
                      <th scope="col" className="py-2 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const a = assetMap.get(p.symbol)
                      const current = a?.price ?? p.avgPrice
                      return (
                        <tr key={p.symbol} className="border-b border-line dark:border-[#2a2a2d] last:border-0">
                          <td className="py-3 pr-4 font-semibold text-ink dark:text-paper">{p.symbol}</td>
                          <td className="py-3 pr-4 text-right text-ink dark:text-paper">{formatQty(p.qty)}</td>
                          <td className="py-3 pr-4 text-right text-muted">{formatMoney(p.avgPrice)}</td>
                          <td className="py-3 pr-4 text-right text-muted">{formatMoney(current)}</td>
                          <td className="py-3 text-right text-ink dark:text-paper">{formatMoney(p.qty * current)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-ink dark:text-paper">Order history</h2>
            {orders.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No orders yet" body="Every order you place is recorded here." />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-line dark:border-[#2a2a2d] text-left text-muted">
                      <th scope="col" className="py-2 pr-4 font-medium">Side</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Symbol</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Quantity</th>
                      <th scope="col" className="py-2 pr-4 font-medium text-right">Price</th>
                      <th scope="col" className="py-2 font-medium text-right">Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-line dark:border-[#2a2a2d] last:border-0">
                        <td className="py-3 pr-4">
                          <span className={o.side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {o.side === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-ink dark:text-paper">{o.symbol}</td>
                        <td className="py-3 pr-4 text-right text-muted">{formatQty(o.qty)}</td>
                        <td className="py-3 pr-4 text-right text-muted">{formatMoney(o.price)}</td>
                        <td className="py-3 text-right text-muted">{timeAgo(o.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-ink dark:text-paper">Order ticket</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <Field label="Asset" htmlFor="dt-symbol">
              <Select id="dt-symbol" value={symbol} onChange={(e) => handleSymbolChange(e.target.value)}>
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            {selected && (
              <p className="text-sm text-muted">
                Current price <span className="font-semibold text-ink dark:text-paper">{formatMoney(selected.price)}</span>{' '}
                <ChangePct value={selected.changePct} />{' '}
                {pricesLive && LIVE_SYMBOLS.has(selected.symbol) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden /> Live
                  </span>
                )}
              </p>
            )}
            <Tabs tabs={[{ id: 'buy', label: 'Buy' }, { id: 'sell', label: 'Sell' }]} value={side} onChange={setSide} />
            <Field label="Quantity" htmlFor="dt-qty" error={qtyError}>
              <Input id="dt-qty" type="number" min="0" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Limit price" htmlFor="dt-price" error={priceError}>
              <Input id="dt-price" type="number" min="0" step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <div className="flex items-center justify-between rounded-xl bg-mist dark:bg-ink px-4 py-3 text-sm">
              <span className="text-muted">Estimated total</span>
              <span className="font-semibold text-ink dark:text-paper">{formatMoney(total)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={total <= 0}>
              Place order
            </Button>
            <p className="text-xs text-muted">Simulated fills at the limit price. No real execution.</p>
          </form>
        </Card>
      </div>
    </Page>
  )
}
