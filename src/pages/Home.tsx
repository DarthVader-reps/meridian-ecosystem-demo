import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { Button, Card, Reveal, SectionHeader, Ticker } from '../components/ui'
import VideoFeature from '../components/VideoFeature'
import { LIVE_SYMBOLS, useAssets, usePricesLive } from '../lib/assetPrices'

const BASE = import.meta.env.BASE_URL

const AREAS = [
  { title: 'Invest', body: 'Plans, stocks, crypto, and real estate — one calm place.', to: '/invest/plans', cta: 'Start investing' },
  { title: 'Trade', body: 'Live-style charts, copy trading, and an AI bot.', to: '/trading/demo', cta: 'Open trading' },
  { title: 'Vehicles', body: 'A curated inventory of fictional electric vehicles.', to: '/vehicles', cta: 'Explore inventory' },
  { title: 'Membership', body: 'Tiers, VIP access, and giveaways.', to: '/membership', cta: 'View tiers' },
  { title: 'Wallet', body: 'Deposits, swaps, and transfers — all simulated.', to: '/wallet/deposit', cta: 'Fund wallet' },
]

const STATS = [
  { value: '$100K', label: 'Demo trading balance' },
  { value: '5', label: 'Ecosystem areas' },
  { value: '0', label: 'Real money at risk' },
]

const CHAPTERS = [
  {
    eyebrow: 'Invest',
    title: 'Grow ',
    accent: 'on your terms',
    body: 'Plans, stocks, crypto, and real estate — one calm dashboard, simulated funds.',
    cta: 'Explore investments',
    to: '/invest/plans',
    img: `${BASE}media/invest-visual.webp`,
  },
  {
    eyebrow: 'Trade',
    title: 'Trade at the ',
    accent: 'speed of now',
    body: 'Live-style charts, copy trading, and an AI bot — with zero real risk.',
    cta: 'Open trading',
    to: '/trading/demo',
    img: `${BASE}media/trading-visual.webp`,
  },
  {
    eyebrow: 'Vehicles',
    title: 'Electric, fictional, ',
    accent: 'yours to browse',
    body: 'A curated inventory of fictional electric vehicles. Reserve a demo test drive.',
    cta: 'Browse inventory',
    to: '/vehicles',
    img: `${BASE}media/vehicle-showcase.webp`,
  },
]

export default function Home() {
  const assets = useAssets()
  const pricesLive = usePricesLive()
  const tickerItems = assets.map((a) => ({
    symbol: a.symbol,
    price: a.price,
    changePct: a.changePct,
    live: pricesLive && LIVE_SYMBOLS.has(a.symbol),
  }))
  return (
    <div>
      {/* Hero — full-bleed video, Tesla-style */}
      <section className="relative -mt-14 flex min-h-[100vh] items-center justify-center overflow-hidden bg-ink text-white" aria-label="Intro">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={`${BASE}media/hero-car.mp4`}
          poster={`${BASE}media/vehicle-showcase.webp`}
          autoPlay
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          ref={(el) => {
            if (el) el.muted = true
          }}
        />
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:px-6">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{BRAND.tagline}</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">
              Money, <span className="text-gradient">made manageable.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              One calm dashboard to invest, trade, and track everything. This demo runs on simulated funds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/invest/plans"
                className="inline-flex min-w-[200px] items-center justify-center rounded-[4px] bg-[var(--color-accent)] px-7 py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90"
              >
                Start investing
              </Link>
              <Link
                to="/trading/demo"
                className="inline-flex min-w-[200px] items-center justify-center rounded-[4px] bg-white/10 px-7 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Try demo trading
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      <Ticker items={tickerItems} />

      {/* Stat band */}
      <section className="border-y border-line dark:border-[#2a2a2d] bg-ink text-white" aria-label="Key figures">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          {STATS.map((s) => (
            <div key={s.label} className="py-10 text-center sm:py-14">
              <Reveal>
                <p className="text-5xl font-semibold tracking-tight sm:text-6xl">{s.value}</p>
                <p className="mt-2 text-sm uppercase tracking-widest text-white/50">{s.label}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* Chapters — full-bleed image bands */}
      {CHAPTERS.map((c, i) => (
        <section
          key={c.to}
          className="relative flex min-h-[80vh] items-center overflow-hidden bg-ink text-white"
          aria-label={c.title}
        >
          <img
            src={c.img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className={`relative mx-auto w-full max-w-7xl px-4 sm:px-6 ${i % 2 === 1 ? 'text-right' : ''}`}>
            <Reveal className={`max-w-xl ${i % 2 === 1 ? 'ml-auto' : ''}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{c.eyebrow}</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{c.title}<span className="text-gradient">{c.accent}</span></h2>
              <p className="mt-4 text-lg text-white/70">{c.body}</p>
              <div className={`mt-8 ${i % 2 === 1 ? 'flex justify-end' : ''}`}>
                <Link
                  to={c.to}
                  className="inline-flex min-w-[200px] items-center justify-center rounded-[4px] bg-white px-7 py-3.5 text-base font-medium text-ink transition-opacity hover:opacity-90"
                >
                  {c.cta}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* Video feature — hosted clip, muted until the user opts into sound */}
      <VideoFeature />

      {/* Entry cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-label="Ecosystem areas">
        <Reveal>
          <SectionHeader title="One ecosystem, five areas" body="Five working prototypes, one ecosystem. Everything below runs on simulated data — click through and try things." />
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((a, i) => (
            <Reveal key={a.to} delay={i * 60}>
              <Card className="flex h-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <h3 className="text-xl font-semibold text-ink dark:text-paper">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{a.body}</p>
                <Link to={a.to} className="mt-5 text-sm font-medium text-[var(--color-accent)] hover:underline">
                  {a.cta} →
                </Link>
              </Card>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <Card className="flex h-full flex-col bg-ink text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-[#111114]">
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6" aria-label="Get started">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-ink dark:text-paper">Step inside <span className="text-gradient">the ecosystem</span></h2>
          <p className="mt-3 text-base text-muted">Open a portfolio, place a demo trade, enter a giveaway — it all updates together.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" to="/invest/portfolio">View portfolio</Button>
            <Button size="lg" variant="secondary" to="/membership/giveaways">Enter giveaway</Button>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
