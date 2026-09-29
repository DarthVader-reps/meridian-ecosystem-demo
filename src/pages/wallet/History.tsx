import { useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Card, EmptyState, Tabs } from '../../components/ui'
import { useWallet } from '../../store/wallet'
import type { Tx, TxType } from '../../store/wallet'
import { formatMoney, formatQty, timeAgo } from '../../lib/market'

type Filter = 'all' | TxType

const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdraw', label: 'Withdrawals' },
  { id: 'transfer', label: 'Transfers' },
  { id: 'swap', label: 'Swaps' },
  { id: 'trade', label: 'Trades' },
]

const TYPE_TONE: Record<TxType, 'neutral' | 'accent' | 'green' | 'red' | 'amber'> = {
  deposit: 'green',
  withdraw: 'red',
  transfer: 'accent',
  swap: 'amber',
  trade: 'neutral',
}

const TYPE_LABEL: Record<TxType, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  transfer: 'Transfer',
  swap: 'Swap',
  trade: 'Trade',
}

function fmtAmount(tx: Tx) {
  const n = Math.abs(tx.amount)
  const sign = tx.amount >= 0 ? '+' : '−'
  return `${sign}${tx.asset === 'USD' ? formatMoney(n) : `${formatQty(n)} ${tx.asset}`}`
}

export default function History() {
  const { transactions } = useWallet()
  const [filter, setFilter] = useState<Filter>('all')

  const rows = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)
  const emptyLabel = TABS.find((t) => t.id === filter)?.label ?? 'Transactions'

  return (
    <Page title="History" intro="Every simulated wallet movement in one place. All money is simulated." disclaimer>
      <Tabs tabs={TABS} value={filter} onChange={setFilter} />
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            title={`No ${emptyLabel.toLowerCase()} yet`}
            body="Simulated activity will appear here once you make a deposit, withdrawal, transfer, swap, or trade."
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line dark:border-[#2a2a2d] text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Asset</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((tx) => (
                    <tr key={tx.id} className="border-b border-line dark:border-[#2a2a2d] last:border-0">
                      <td className="px-5 py-3 text-muted whitespace-nowrap">{timeAgo(tx.date)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={TYPE_TONE[tx.type]}>{TYPE_LABEL[tx.type]}</Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-ink dark:text-paper">{tx.asset}</td>
                      <td
                        className={`px-5 py-3 text-right font-medium whitespace-nowrap ${
                          tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {fmtAmount(tx)}
                      </td>
                      <td className="px-5 py-3 text-muted">{tx.detail ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Page>
  )
}
