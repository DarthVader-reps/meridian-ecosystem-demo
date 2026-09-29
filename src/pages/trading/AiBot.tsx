import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, Field, Input, Select } from '../../components/ui'
import { Page } from '../../components/layout'
import { useTrading } from '../../store/trading'
import { useUI } from '../../store/ui'
import { cn } from '../../lib/cn'

const STRATEGIES = [
  { id: 'Balanced trend', description: 'Follows medium-term trends across diversified assets.' },
  { id: 'Mean reversion', description: 'Buys dips and sells rallies within a stable range.' },
  { id: 'Momentum burst', description: 'Chases short-term breakouts with tight exits.' },
]

type RiskLevel = 'Conservative' | 'Moderate' | 'Aggressive'

export default function AiBot() {
  const { botRunning, botStrategy, botLog, startBot, pauseBot, botTick } = useTrading()
  const pushToast = useUI((s) => s.pushToast)

  const [strategy, setStrategy] = useState(botStrategy)
  const [risk, setRisk] = useState<RiskLevel>('Moderate')
  const [maxTrade, setMaxTrade] = useState('500')
  const [tradeError, setTradeError] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!botRunning) return
    const id = setInterval(botTick, 2500)
    return () => clearInterval(id)
  }, [botRunning, botTick])

  useEffect(() => {
    const el = logRef.current
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight })
  }, [botLog])

  function handleStart() {
    const n = Number(maxTrade)
    if (!Number.isFinite(n) || n <= 0) {
      setTradeError('Max trade size must be greater than zero.')
      return
    }
    setTradeError('')
    startBot(strategy)
    pushToast('Bot started', `${strategy} is running on a simulated feed with ${risk} risk.`)
  }

  function handlePause() {
    pauseBot()
    pushToast('Bot paused', 'The bot stopped placing simulated trades.')
  }

  return (
    <Page title="AI bot" intro="Run an automated strategy against simulated market data. No real orders are placed." disclaimer>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink dark:text-paper">Activity log</h2>
            <Badge tone={botRunning ? 'green' : 'neutral'}>{botRunning ? 'Running' : 'Paused'}</Badge>
          </div>
          <div
            ref={logRef}
            aria-live="polite"
            className="mt-4 h-80 overflow-y-auto rounded-xl border border-line dark:border-[#2a2a2d] bg-ink dark:bg-[#141416] p-4"
          >
            {botLog.length === 0 ? (
              <p className="text-sm text-paper/60">No activity yet. Start the bot to generate simulated signals.</p>
            ) : (
              <ul className="space-y-1.5 font-mono text-xs text-paper/85">
                {botLog.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">Log entries are simulated and produced locally for demonstration.</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink dark:text-paper">Configuration</h2>
          <div className="mt-4 space-y-3" role="radiogroup" aria-label="Strategy preset">
            {STRATEGIES.map((s) => {
              const active = strategy === s.id
              return (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setStrategy(s.id)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left cursor-pointer transition-colors',
                    active
                      ? 'border-[var(--color-accent)] bg-accent-soft dark:bg-[#1b2a5c]'
                      : 'border-line dark:border-[#2a2a2d] hover:bg-mist dark:hover:bg-ink',
                  )}
                >
                  <span className="text-sm font-semibold text-ink dark:text-paper">{s.id}</span>
                  <span className="mt-1 block text-sm text-muted">{s.description}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Risk level" htmlFor="bot-risk">
              <Select id="bot-risk" value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel)}>
                <option>Conservative</option>
                <option>Moderate</option>
                <option>Aggressive</option>
              </Select>
            </Field>
            <Field label="Max trade size (USD)" htmlFor="bot-max" error={tradeError}>
              <Input
                id="bot-max"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={maxTrade}
                onChange={(e) => setMaxTrade(e.target.value)}
              />
            </Field>
            {botRunning ? (
              <Button variant="secondary" className="w-full" onClick={handlePause}>
                Pause bot
              </Button>
            ) : (
              <Button className="w-full" onClick={handleStart}>
                Start bot
              </Button>
            )}
            <p className="text-xs text-muted">The bot paper-trades simulated positions. Nothing leaves this browser.</p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
