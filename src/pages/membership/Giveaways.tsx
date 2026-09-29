import { useEffect, useState } from 'react'
import { Page } from '../../components/layout'
import { Badge, Button, Card, EmptyState, LoadingState, Tabs } from '../../components/ui'
import { useMembership } from '../../store/membership'
import { useUI } from '../../store/ui'
import giveawaysData from '../../mock/giveaways.json'

interface Giveaway {
  id: string
  title: string
  prize: string
  entries: number
  endsIn?: string
  status: 'active' | 'past'
  winner?: string
}

const giveaways = giveawaysData as Giveaway[]

type TabId = 'active' | 'entered' | 'past'

export default function GiveawaysPage() {
  const giveawayEntries = useMembership((s) => s.giveawayEntries)
  const enterGiveaway = useMembership((s) => s.enterGiveaway)
  const pushToast = useUI((s) => s.pushToast)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('active')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const active = giveaways.filter((g) => g.status === 'active')
  const entered = giveaways.filter((g) => giveawayEntries.includes(g.id))
  const past = giveaways.filter((g) => g.status === 'past')

  const enter = (g: Giveaway) => {
    enterGiveaway(g.id)
    pushToast('Entry recorded (simulated)', `You entered "${g.title}".`)
  }

  return (
    <Page title="Giveaways" intro="Win demo credit and experiences. All prizes are simulated.">
      {loading ? (
        <LoadingState label="Loading giveaways" />
      ) : (
        <>
          <Tabs
            tabs={[
              { id: 'active', label: 'Active' },
              { id: 'entered', label: 'Entered' },
              { id: 'past', label: 'Past winners' },
            ]}
            value={tab}
            onChange={setTab}
          />

          <div className="mt-6">
            {tab === 'active' && (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((g) => {
                  const isEntered = giveawayEntries.includes(g.id)
                  return (
                    <li key={g.id}>
                      <Card className="flex h-full flex-col">
                        <h2 className="text-lg font-semibold text-ink dark:text-paper">{g.title}</h2>
                        <p className="mt-1 text-sm text-muted">
                          Prize: {g.prize} <span className="text-muted">(simulated)</span>
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                          <span>{g.entries.toLocaleString()} entries</span>
                          {g.endsIn && <span>Ends in {g.endsIn}</span>}
                        </div>
                        <div className="mt-5 flex flex-1 items-end">
                          {isEntered ? (
                            <div className="flex items-center gap-3">
                              <Badge tone="green">Entered</Badge>
                              <Button size="sm" variant="secondary" disabled>
                                Enter giveaway
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => enter(g)}>
                              Enter giveaway
                            </Button>
                          )}
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}

            {tab === 'entered' &&
              (entered.length === 0 ? (
                <EmptyState
                  title="No entries yet"
                  body="You have not entered any giveaways. Browse the active ones and enter."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setTab('active')}>
                      View active giveaways
                    </Button>
                  }
                />
              ) : (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {entered.map((g) => (
                    <li key={g.id}>
                      <Card>
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="text-lg font-semibold text-ink dark:text-paper">{g.title}</h2>
                          <Badge tone="green">Entered</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          Prize: {g.prize} <span className="text-muted">(simulated)</span>
                        </p>
                        {g.endsIn && <p className="mt-2 text-sm text-muted">Ends in {g.endsIn}</p>}
                      </Card>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === 'past' && (
              <Card className="max-w-2xl">
                <ul className="divide-y divide-line dark:divide-[#2a2a2d]">
                  {past.map((g) => (
                    <li key={g.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-semibold text-ink dark:text-paper">{g.title}</h2>
                        <Badge tone="neutral">Closed</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        Winner: <span className="font-medium text-ink dark:text-paper">{g.winner}</span> — {g.prize}{' '}
                        <span className="text-muted">(simulated)</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </>
      )}
    </Page>
  )
}
