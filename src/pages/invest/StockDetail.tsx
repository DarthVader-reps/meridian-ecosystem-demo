import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PriceChart,
  Stat,
  Tabs,
} from '../../components/ui'
import { usePortfolio } from '../../store/portfolio'
import { useWallet } from '../../store/wallet'
import { useUI } from '../../store/ui'
import { formatMoney, formatPct, formatQty, priceHistory, rangeSlice } from '../../lib/market'
import type { PricePoint } from '../../lib/market'
import assetsJson from '../../mock/assets.json'

interface Asset {
  symbol: string
  name: string
  type: 'stock' | 'crypto'
  price: number
  changePct: number
  currency: string
  sector: string
}

const assets = assetsJson as unknown as Asset[]

type RangeKey = '1D' | '1W' | '1M' | '1Y' | 'All'
type Side = 'buy' | 'sell'

const RANGES: { id: RangeKey; label: string }[] = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '1Y', label: '1Y' },
  { id: 'All', label: 'All' },
]

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const key = (symbol ?? '').toUpperCase()

  const asset = useMemo(
    () => assets.find((a) => a.type === 'stock' && a.symbol.toUpperCase() === key),
    [key],
  )

  const [ready, setReady] = useState(false)
  const [range, setRange] = useState<RangeKey>('1M')
  const [modalOpen, setModalOpen] = useState(false)
  const [side, setSide] = useState<Side>('buy')
  const [qty, setQty] = useState('')
  const [formError, setFormError] = useState<string | undefined>()

  const holdings = usePortfolio((s) => s.holdings)
  const buy = usePortfolio((s) => s.buy)
  const sell = usePortfolio((s) => s.sell)
  const balances = useWallet((s) => s.balances)
  const withdraw = useWallet((s) => s.withdraw)
  const deposit = useWallet((s) => s.deposit)
  const pushToast = useUI((s) => s.pushToast)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  const history: PricePoint[] = useMemo(
    () => (asset ? priceHistory(asset.symbol, asset.price, 150) : []),
    [asset],
  )
  const data = useMemo(() => rangeSlice(history, range), [history, range])

  const holding = asset ? holdings.find((h) => h.symbol === asset.symbol) : undefined
  const usdBalance = balances['USD'] ?? 0
  const qtyNum = Number(qty)
  const estimated = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum * (asset?.price ?? 0) : 0

  const openPanel = (next: Side) => {
    setSide(next)
    setQty('')
    setFormError(undefined)
    setModalOpen(true)
  }

  const submit = () => {
    if (!asset) return
    if (qty.trim() === '' || Number.isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Enter a quantity greater than zero.')
      return
    }
    if (side === 'buy') {
      const cost = qtyNum * asset.price
      if (cost > usdBalance) {
        setFormError(`Insufficient USD balance. Available: ${formatMoney(usdBalance, 0)}.`)
        return
      }
      if (!withdraw('USD', cost, `Bought ${qtyNum} ${asset.symbol}`)) {
        setFormError('Could not complete the withdrawal.')
        return
      }
      buy(asset.symbol, qtyNum, asset.price)
      pushToast('Order filled', `Bought ${formatQty(qtyNum)} ${asset.symbol} for ${formatMoney(cost)}.`)
    } else {
      if (!holding || qtyNum > holding.qty) {
        setFormError(`You hold ${formatQty(holding?.qty ?? 0)} ${asset.symbol}.`)
        return
      }
      const proceeds = qtyNum * asset.price
      if (!sell(asset.symbol, qtyNum, asset.price)) {
        setFormError('Could not complete the sale.')
        return
      }
      deposit('USD', proceeds, `Sold ${qtyNum} ${asset.symbol}`)
      pushToast('Order filled', `Sold ${formatQty(qtyNum)} ${asset.symbol} for ${formatMoney(proceeds)}.`)
    }
    setModalOpen(false)
    setQty('')
  }

  if (!ready) {
    return (
      <Page title="Stock detail" intro="Loading simulated quote." disclaimer>
        <LoadingState label="Loading stock" />
      </Page>
    )
  }

  if (!asset) {
    return (
      <Page title="Stock not found" intro="This simulated symbol does not exist." disclaimer>
        <ErrorState
          title="Unknown stock"
          body={`No simulated stock found for "${key}". It may have been renamed or removed.`}
          onRetry={() => navigate('/invest/stocks')}
        />
      </Page>
    )
  }

  const changeClass = asset.changePct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

  return (
    <Page title={asset.name} intro={`${asset.symbol} · ${asset.sector} · Simulated quote`} disclaimer>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink dark:text-paper">{asset.symbol}</p>
              <p className="text-sm text-muted">{asset.currency}</p>
            </div>
            <Badge tone={asset.changePct >= 0 ? 'green' : 'red'}>{formatPct(asset.changePct)} today</Badge>
          </div>
          <div className="mt-4">
            <PriceChart data={data} height={260} />
          </div>
          <div className="mt-4">
            <Tabs tabs={RANGES} value={range} onChange={setRange} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Price" value={formatMoney(asset.price)} />
              <Stat
                label="Day change"
                value={formatPct(asset.changePct)}
                sub={<span className={changeClass}>simulated</span>}
              />
              <Stat label="Sector" value={asset.sector} />
              <Stat
                label="Your holding"
                value={holding ? formatQty(holding.qty) : '0'}
                sub={
                  holding && (
                    <span className="text-muted">
                      Avg {formatMoney(holding.avgPrice)} · Value {formatMoney(holding.qty * asset.price)}
                    </span>
                  )
                }
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => openPanel('buy')} className="flex-1">
                Buy
              </Button>
              <Button variant="secondary" onClick={() => openPanel('sell')} className="flex-1">
                Sell
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted">USD balance: {formatMoney(usdBalance, 0)}</p>
          </Card>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${side === 'buy' ? 'Buy' : 'Sell'} ${asset.symbol}`}>
        <div className="space-y-4">
          <Tabs
            tabs={[
              { id: 'buy' as Side, label: 'Buy' },
              { id: 'sell' as Side, label: 'Sell' },
            ]}
            value={side}
            onChange={(v) => {
              setSide(v)
              setQty('')
              setFormError(undefined)
            }}
          />
          <Field label="Quantity" error={formError} htmlFor="trade-qty">
            <Input
              id="trade-qty"
              inputMode="decimal"
              placeholder="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Price per share</dt>
              <dd className="font-medium text-ink dark:text-paper">{formatMoney(asset.price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Estimated {side === 'buy' ? 'cost' : 'proceeds'}</dt>
              <dd className="font-medium text-ink dark:text-paper">{formatMoney(estimated)}</dd>
            </div>
          </dl>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={submit} className="flex-1">
              Confirm {side === 'buy' ? 'buy' : 'sell'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  )
}
