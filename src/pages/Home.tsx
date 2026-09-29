import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { Button, Card, Reveal, SectionHeader, Ticker } from '../components/ui'
import assets from '../mock/assets.json'

const AREAS = [
  { title: 'Invest', body: 'Plans, stocks, crypto, and real estate in one place.', to: '/invest/plans', cta: 'Start investing' },
  { title: 'Trade', body: 'Demo trading, live-style charts, and copy trading.', to: '/trading/demo', cta: 'Open trading' },
  { title: 'Vehicles', body: 'Browse a fictional electric inventory.', to: '/vehicles', cta: 'Explore inventory' },
  { title: 'Membership', body: 'Tiers, VIP access, and giveaways.', to: '/membership', cta: 'View tiers' },
  { title: 'Wallet', body: 'Deposits, swaps, and transfers — all simulated.', to: '/wallet/deposit', cta: 'Fund wallet' },
]

const HIGHLIGHTS = [
  { title: 'One balance everywhere', body: 'A deposit updates your wallet, portfolio, and history instantly. Everything is stored in your browser.' },
  { title: 'Practice without risk', body: 'Demo trading runs on a simulated feed with a $100,000 practice balance. Reset it any time.' },
  { title: 'Copy experienced traders', body: 'Browse trader stats on simulated track records, then copy or stop copying in one tap.' },
]

export default function Home() {
  const tickerItems = assets.map((a) => ({ symbol: a.symbol, price: a.price, changePct: a.changePct }))
  return (
    <div>
      {/* Hero — full bleed, dark, abstract SVG shapes only */}
      <section className="relative -mt-14 overflow-hidden bg-ink text-white" aria-label="Intro">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.14]">
          <circle cx="85%" cy="15%" r="220" fill="none" stroke="#fff" strokeWidth="1" />
          <circle cx="85%" cy="15%" r="150" fill="none" stroke="#fff" strokeWidth="1" />
          <circle cx="8%" cy="85%" r="180" fill="none" stroke="#fff" strokeWidth="1" />
          <line x1="0" y1="62%" x2="100%" y2="62%" stroke="#fff" strokeWidth="1" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#fff" strokeWidth="1" />
        </svg>
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 pt-24 pb-16 sm:px-6">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{BRAND.tagline}</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">
              Money, made manageable.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              Invest, trade, and track everything from one calm dashboard. This demo runs on simulated funds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" to="/invest/plans">Start investing</Button>
              <Button size="lg" variant="secondary" to="/trading/demo" className="!bg-white/10 !text-white hover:!bg-white/20">
                Try demo trading
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Ticker items={tickerItems} />

      {/* Entry cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-label="Ecosystem areas">
        <Reveal>
          <SectionHeader title="One ecosystem, five areas" body="Every section below is a working prototype with simulated data. Click through and try things." />
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((a, i) => (
            <Reveal key={a.to} delay={i * 60}>
              <Card className="flex h-full flex-col">
                <h3 className="text-xl font-semibold text-ink dark:text-paper">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{a.body}</p>
                <Link to={a.to} className="mt-5 text-sm font-medium text-[var(--color-accent)] hover:underline">
                  {a.cta} →
                </Link>
              </Card>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <Card className="flex h-full flex-col bg-ink text-white dark:bg-[#111114]">
              <h3 className="text-xl font-semibold">Demo first</h3>
              <p className="mt-2 flex-1 text-sm text-white/70">
                Simulated funds only. No real payments, no real markets, no real risk.
              </p>
              <Link to="/wallet/deposit" className="mt-5 text-sm font-medium text-white hover:underline">
                Fund demo wallet →
              </Link>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t border-line dark:border-[#2a2a2d] bg-mist dark:bg-ink-soft" aria-label="Highlights">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <SectionHeader title="Built for clarity" />
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {HIGHLIGHTS.map((h, i) => (
              <Reveal key={h.title} delay={i * 80}>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-ink dark:text-paper">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{h.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6" aria-label="Get started">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-ink dark:text-paper">Take the tour</h2>
          <p className="mt-3 text-base text-muted">Open your portfolio, place a demo trade, or enter a giveaway. It all updates together.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" to="/invest/portfolio">View portfolio</Button>
            <Button size="lg" variant="secondary" to="/membership/giveaways">Enter giveaway</Button>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
