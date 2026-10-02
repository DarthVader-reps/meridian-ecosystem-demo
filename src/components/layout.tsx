import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BRAND, DEMO_DISCLAIMER } from '../config/brand'
import { useUI } from '../store/ui'
import { useNotifications } from '../store/notifications'
import { useSettings } from '../store/settings'
import { useAuth } from '../store/auth'
import { cn } from '../lib/cn'

/* ---------- Persistent demo bar ---------- */

export function DemoBar() {
  const { settings } = useSettings()
  return (
    <>
      {settings.showEnvBanner && (
        <div className="z-[70] bg-ink text-paper dark:bg-[#2a2a2d]" role="note" aria-label="Preview environment notice">
          <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-medium tracking-wide">
            Preview environment · Simulated funds · Nothing here is real money.
          </p>
        </div>
      )}
      {settings.maintenanceMode && (
        <div className="z-[70] bg-amber-500 text-white" role="alert" aria-label="Maintenance mode notice">
          <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-semibold tracking-wide">
            Maintenance mode is on — demo actions are temporarily paused.
          </p>
        </div>
      )}
    </>
  )
}

/* ---------- Notification bell ---------- */

function NotificationBell({ light }: { light?: boolean }) {
  const unread = useNotifications((s) => s.notifications.filter((n) => !n.read).length)
  return (
    <Link
      to="/account/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      className={cn(
        'relative rounded-full p-2 text-sm cursor-pointer',
        light ? 'text-white hover:bg-white/10' : 'text-ink dark:text-paper hover:bg-mist dark:hover:bg-ink-soft',
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}

/* ---------- Auth nav ---------- */

function AuthNav({ light }: { light?: boolean }) {
  const { user, initialized, signOut } = useAuth()
  if (!initialized) return null
  const linkCls = cn(
    'rounded-lg px-3 py-1.5 text-sm font-medium',
    light ? 'text-white hover:bg-white/10' : 'text-ink dark:text-paper hover:bg-mist dark:hover:bg-ink-soft',
  )
  if (!user) {
    return (
      <div className="hidden items-center gap-1 sm:flex">
        <Link to="/login" className={linkCls}>Log in</Link>
        <Link
          to="/signup"
          className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Sign up
        </Link>
      </div>
    )
  }
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Link to="/dashboard" className={linkCls} title="Your dashboard">
        {user.name.split(' ')[0]}
      </Link>
      <button
        onClick={() => void signOut()}
        className={cn(linkCls, 'cursor-pointer')}
      >
        Log out
      </button>
    </div>
  )
}

function MobileAuthNav({ onNavigate }: { onNavigate: () => void }) {
  const { user, initialized, signOut } = useAuth()
  if (!initialized) return null
  if (!user) {
    return (
      <div className="flex gap-2 border-b border-line py-3 dark:border-[#2a2a2d]">
        <Link to="/login" onClick={onNavigate} className="flex-1 rounded-lg border border-line px-3 py-2 text-center text-sm font-medium text-ink dark:border-[#2a2a2d] dark:text-paper">
          Log in
        </Link>
        <Link to="/signup" onClick={onNavigate} className="flex-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-center text-sm font-semibold text-white">
          Sign up
        </Link>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line py-3 dark:border-[#2a2a2d]">
      <Link to="/dashboard" onClick={onNavigate} className="text-sm font-semibold text-ink dark:text-paper">
        {user.name}
      </Link>
      <button
        onClick={() => { void signOut(); onNavigate() }}
        className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted dark:border-[#2a2a2d] cursor-pointer"
      >
        Log out
      </button>
    </div>
  )
}

/* ---------- Navigation ---------- */

interface NavGroup {
  label: string
  items: { label: string; to: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  { label: 'Dashboard', items: [{ label: 'Overview', to: '/dashboard' }] },
  {
    label: 'Invest',
    items: [
      { label: 'Plans', to: '/invest/plans' },
      { label: 'Stocks', to: '/invest/stocks' },
      { label: 'Crypto', to: '/invest/crypto' },
      { label: 'Real estate', to: '/invest/real-estate' },
      { label: 'Portfolio', to: '/invest/portfolio' },
    ],
  },
  { label: 'Vehicles', items: [{ label: 'Inventory', to: '/vehicles' }] },
  {
    label: 'Membership',
    items: [
      { label: 'Tiers', to: '/membership' },
      { label: 'My membership', to: '/membership/my' },
      { label: 'VIP', to: '/membership/vip' },
      { label: 'Giveaways', to: '/membership/giveaways' },
    ],
  },
  {
    label: 'Trading',
    items: [
      { label: 'Paper trading', to: '/trading/demo' },
      { label: 'Live markets', to: '/trading/live' },
      { label: 'Copy trading', to: '/trading/copy' },
      { label: 'AI bot', to: '/trading/bot' },
      { label: 'Managed', to: '/trading/managed' },
    ],
  },
  {
    label: 'Wallet',
    items: [
      { label: 'Deposit', to: '/wallet/deposit' },
      { label: 'Withdraw', to: '/wallet/withdraw' },
      { label: 'Transfer', to: '/wallet/transfer' },
      { label: 'Swap', to: '/wallet/swap' },
      { label: 'History', to: '/wallet/history' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: '/account/profile' },
      { label: 'Verify identity', to: '/account/verify' },
      { label: 'Security', to: '/account/security' },
      { label: 'Notifications', to: '/account/notifications' },
      { label: 'Support', to: '/account/support' },
    ],
  },
]

function Wordmark({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label={`${BRAND.name} home`}>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: BRAND.accentColor }}
      >
        {BRAND.logoText.charAt(0)}
      </span>
      <span className={cn('text-lg font-semibold tracking-tight', light ? 'text-white' : 'text-ink dark:text-paper')}>
        {BRAND.logoText}
      </span>
    </Link>
  )
}

export function Navbar({ overlay }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const { theme, toggleTheme } = useUI()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setOpenGroup(null)
  }, [location.pathname])

  const transparent = overlay && !scrolled && !open
  const light = transparent

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors',
        transparent ? 'bg-transparent' : 'border-b border-line dark:border-[#2a2a2d] bg-paper/90 dark:bg-ink/90 backdrop-blur',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark light={light} />

        {/* Desktop */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_GROUPS.map((g) => (
            <li key={g.label} className="group relative">
              <button
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium cursor-pointer',
                  light ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-ink dark:text-paper hover:bg-mist dark:hover:bg-ink-soft',
                )}
                aria-haspopup="true"
              >
                {g.label}
              </button>
              <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <ul className="w-52 rounded-xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-1.5 shadow-lg">
                  {g.items.map((it) => (
                    <li key={it.to}>
                      <NavLink
                        to={it.to}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-lg px-3 py-2 text-sm',
                            isActive ? 'bg-accent-soft dark:bg-[#1b2a5c] text-[var(--color-accent)] font-medium' : 'text-ink dark:text-paper hover:bg-mist dark:hover:bg-ink',
                          )
                        }
                      >
                        {it.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <AuthNav light={light} />
          <NotificationBell light={light} />
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            className={cn(
              'rounded-full p-2 text-sm cursor-pointer',
              light ? 'text-white hover:bg-white/10' : 'text-ink dark:text-paper hover:bg-mist dark:hover:bg-ink-soft',
            )}
          >
            {theme === 'light' ? '◐' : '◑'}
          </button>
          <button
            className={cn('rounded-lg p-2 lg:hidden cursor-pointer', light ? 'text-white' : 'text-ink dark:text-paper')}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true" className="block text-xl leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink px-4 pb-6 pt-2 lg:hidden">
          <MobileAuthNav onNavigate={() => setOpen(false)} />
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="border-b border-line dark:border-[#2a2a2d] last:border-0">
              <button
                className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-ink dark:text-paper cursor-pointer"
                onClick={() => setOpenGroup((cur) => (cur === g.label ? null : g.label))}
                aria-expanded={openGroup === g.label}
              >
                {g.label}
                <span aria-hidden="true" className="text-muted">{openGroup === g.label ? '−' : '+'}</span>
              </button>
              {openGroup === g.label && (
                <ul className="pb-3 pl-1">
                  {g.items.map((it) => (
                    <li key={it.to}>
                      <NavLink to={it.to} className="block rounded-lg px-2 py-2 text-sm text-muted hover:text-ink dark:hover:text-paper">
                        {it.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}

/* ---------- Footer ---------- */

const FOOT_COLS: { title: string; links: { label: string; to: string }[] }[] = [
  { title: 'Invest', links: [{ label: 'Plans', to: '/invest/plans' }, { label: 'Stocks', to: '/invest/stocks' }, { label: 'Crypto', to: '/invest/crypto' }, { label: 'Real estate', to: '/invest/real-estate' }] },
  { title: 'Trading', links: [{ label: 'Paper trading', to: '/trading/demo' }, { label: 'Live markets', to: '/trading/live' }, { label: 'Copy trading', to: '/trading/copy' }, { label: 'AI bot', to: '/trading/bot' }] },
  { title: 'Wallet', links: [{ label: 'Deposit', to: '/wallet/deposit' }, { label: 'Withdraw', to: '/wallet/withdraw' }, { label: 'Swap', to: '/wallet/swap' }, { label: 'History', to: '/wallet/history' }] },
  { title: 'Account', links: [{ label: 'Profile', to: '/account/profile' }, { label: 'Security', to: '/account/security' }, { label: 'Support', to: '/account/support' }] },
]

export function Footer() {
  return (
    <footer className="border-t border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">{BRAND.tagline}. A simulated investing and trading prototype.</p>
        </div>
        {FOOT_COLS.map((col) => (
          <nav key={col.title} aria-label={`Footer – ${col.title}`}>
            <p className="text-sm font-semibold text-ink dark:text-paper">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted hover:text-ink dark:hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line dark:border-[#2a2a2d]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-xs leading-relaxed text-muted">{DEMO_DISCLAIMER}</p>
          <p className="mt-2 text-xs text-muted">© 2026 {BRAND.name}. Preview build.</p>
        </div>
      </div>
    </footer>
  )
}

/* ---------- Breadcrumbs ---------- */

const CRUMB_LABELS: Record<string, string> = {
  invest: 'Invest', plans: 'Plans', stocks: 'Stocks', crypto: 'Crypto', 'real-estate': 'Real estate', portfolio: 'Portfolio',
  vehicles: 'Vehicles', membership: 'Membership', my: 'My membership', vip: 'VIP', giveaways: 'Giveaways',
  trading: 'Trading', demo: 'Paper trading', live: 'Live markets', copy: 'Copy trading', bot: 'AI bot', managed: 'Managed',
  wallet: 'Wallet', deposit: 'Deposit', withdraw: 'Withdraw', transfer: 'Transfer', swap: 'Swap', history: 'History', connect: 'Connect wallet',
  account: 'Account', profile: 'Profile', verify: 'Verify identity', security: 'Security', notifications: 'Notifications', support: 'Support',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((p, i) => ({
    label: CRUMB_LABELS[p] ?? p,
    to: '/' + parts.slice(0, i + 1).join('/'),
    last: i === parts.length - 1,
  }))
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <li>
          <Link to="/" className="hover:text-ink dark:hover:text-paper">Home</Link>
        </li>
        {crumbs.map((c) => (
          <li key={c.to} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {c.last ? (
              <span aria-current="page" className="text-ink dark:text-paper font-medium">{c.label}</span>
            ) : (
              <Link to={c.to} className="hover:text-ink dark:hover:text-paper">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ---------- Disclaimer banner (trading / wallet / invest screens) ---------- */

export function DisclaimerBanner() {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3" role="note">
      <p className="text-sm text-amber-800 dark:text-amber-200">{DEMO_DISCLAIMER}</p>
    </div>
  )
}

/* ---------- Page wrapper ---------- */

export function Page({
  title,
  intro,
  disclaimer = false,
  children,
  wide = false,
}: {
  title: string
  intro?: string
  disclaimer?: boolean
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={cn('mx-auto w-full px-4 pb-16 pt-6 sm:px-6', wide ? 'max-w-7xl' : 'max-w-7xl')}>
      <h1 className="text-3xl font-semibold tracking-tight text-ink dark:text-paper sm:text-4xl">{title}</h1>
      {intro && <p className="mt-2 max-w-2xl text-base text-muted">{intro}</p>}
      {disclaimer && (
        <div className="mt-4">
          <DisclaimerBanner />
        </div>
      )}
      <div className="mt-8">{children}</div>
    </div>
  )
}
