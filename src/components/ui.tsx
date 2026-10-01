import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BRAND } from '../config/brand'
import { useUI } from '../store/ui'
import type { PricePoint } from '../lib/market'
import { cn } from '../lib/cn'

/* ---------- Buttons ---------- */

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  className?: string
  children: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant = 'primary', size = 'md', to, className, children, ...rest }: ButtonProps) {
  const styles = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    size === 'sm' && 'px-3.5 py-1.5 text-sm',
    size === 'md' && 'px-5 py-2.5 text-sm',
    size === 'lg' && 'px-7 py-3.5 text-base',
    variant === 'primary' && 'text-white hover:opacity-90',
    variant === 'secondary' && 'bg-mist dark:bg-ink-soft text-ink dark:text-paper hover:bg-line dark:hover:bg-[#2a2a2d]',
    variant === 'ghost' && 'text-ink dark:text-paper hover:bg-mist dark:hover:bg-ink-soft',
    variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
    className,
  )
  const accent = variant === 'primary' ? { backgroundColor: BRAND.accentColor } : undefined
  if (to) {
    return (
      <Link to={to} className={styles} style={accent}>
        {children}
      </Link>
    )
  }
  return (
    <button className={styles} style={accent} {...rest}>
      {children}
    </button>
  )
}

/* ---------- Card ---------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)}>
      {children}
    </div>
  )
}

/* ---------- Forms ---------- */

export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink dark:text-paper">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink px-4 py-2.5 text-sm text-ink dark:text-paper placeholder:text-muted focus:border-[var(--color-accent)] outline-none transition-colors'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, props.className)} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, props.className)} rows={props.rows ?? 4} />
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
        checked ? 'bg-[var(--color-accent)]' : 'bg-line dark:bg-[#3a3a3d]',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

/* ---------- Badge / Stat ---------- */

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'green' | 'red' | 'amber'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-mist dark:bg-[#2a2a2d] text-ink dark:text-paper',
        tone === 'accent' && 'bg-accent-soft dark:bg-[#1b2a5c] text-[var(--color-accent)] dark:text-[#9db9ff]',
        tone === 'green' && 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
        tone === 'red' && 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
        tone === 'amber' && 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
      )}
    >
      {children}
    </span>
  )
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-paper">{value}</p>
      {sub && <div className="mt-1 text-sm">{sub}</div>}
    </div>
  )
}

/* ---------- Tabs ---------- */

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1 rounded-full bg-mist dark:bg-ink-soft p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer',
            value === t.id ? 'bg-paper dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-muted hover:text-ink dark:hover:text-paper',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Modal ---------- */

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Escape-to-close. The listener is registered once per open so typing
  // (which re-renders the parent and recreates onClose) doesn't churn it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  // Initial focus: only on the open transition, never on re-renders.
  // Focusing on every render stole focus mid-typing — typing "50" into an
  // amount field ended as "5" because the second keystroke landed on the
  // focused ✕ button instead of the input.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      ref.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
    }
    wasOpen.current = open
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="relative w-full max-w-md rounded-2xl bg-paper dark:bg-ink-soft p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink dark:text-paper">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-full p-2 text-muted hover:bg-mist dark:hover:bg-ink cursor-pointer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------- Toasts ---------- */

export function Toasts() {
  const { toasts, dismissToast } = useUI()
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismissToast(t.id), 4500))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismissToast])
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-xl border border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink-soft p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink dark:text-paper">{t.title}</p>
              {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="text-muted hover:text-ink cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Loading / empty / error ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-mist dark:bg-[#2a2a2d]', className)} />
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 py-8" role="status" aria-label={label}>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line dark:border-[#2a2a2d] px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink dark:text-paper">{title}</p>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-6 py-12 text-center">
      <p className="text-base font-semibold text-red-700 dark:text-red-300">{title}</p>
      <p className="max-w-sm text-sm text-red-600 dark:text-red-400">{body}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-3">
          Try again
        </Button>
      )}
    </div>
  )
}

/* ---------- Section header / reveal ---------- */

export function SectionHeader({ eyebrow, title, body, align = 'left' }: { eyebrow?: string; title: string; body?: string; align?: 'left' | 'center' }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink dark:text-paper sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-base text-muted">{body}</p>}
    </div>
  )
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setVisible(true), obs.disconnect())),
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={cn(visible ? 'animate-reveal' : 'opacity-0', className)}
      style={visible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/* ---------- Chart ---------- */

export function PriceChart({ data, height = 220, accent = BRAND.accentColor }: { data: PricePoint[]; height?: number; accent?: string }) {
  const [id] = useState(() => `g${Math.random().toString(36).slice(2)}`)
  return (
    <div style={{ height }} role="img" aria-label="Price chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Price']}
            contentStyle={{ borderRadius: 12, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="price" stroke={accent} strokeWidth={2} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Ticker ---------- */

export function Ticker({ items }: { items: { symbol: string; price: number; changePct: number; live?: boolean }[] }) {
  return (
    <div className="overflow-x-auto thin-scroll border-y border-line dark:border-[#2a2a2d] bg-paper dark:bg-ink" aria-label="Market ticker">
      <div className="flex min-w-max items-center gap-8 px-6 py-2.5">
        {items.map((it) => (
          <span key={it.symbol} className="flex items-center gap-2 text-sm whitespace-nowrap">
            {it.live && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" title="Live market price" aria-label="Live price" />
            )}
            <span className="font-semibold text-ink dark:text-paper">{it.symbol}</span>
            <span className="text-muted">${it.price.toLocaleString()}</span>
            <span className={it.changePct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {it.changePct >= 0 ? '+' : ''}
              {it.changePct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
