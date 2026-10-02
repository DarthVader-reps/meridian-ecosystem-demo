import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from './ui'

const BASE = import.meta.env.BASE_URL

function SpeakerOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function SpeakerOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

/**
 * Homepage feature section: hosted video autoplays muted (mobile-safe via
 * playsInline + the muted property set on mount), with a user-controlled
 * sound toggle. Unmuting is always an explicit user gesture.
 */
export default function VideoFeature() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [muted, setMuted] = useState(true)

  // Stable identity: an inline ref callback would re-run on every render
  // (new function identity) and re-mute the video, clobbering the toggle.
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    // Set the muted *property* (not just the attribute) so muted
    // autoplay is honored across browsers; keep it muted until
    // the user explicitly toggles sound on.
    videoRef.current = el
    if (el) el.muted = true
  }, [])

  const toggleSound = () => {
    const video = videoRef.current
    const next = !muted
    setMuted(next)
    if (video) {
      video.muted = next
      if (!next) {
        // The click is a user gesture, so playback with sound is allowed;
        // resume in case the browser paused the element.
        void video.play().catch(() => {})
      }
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24" aria-label="Meridian in motion">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            <video
              className="aspect-video w-full object-cover"
              src={`${BASE}media/hero-car.mp4`}
              autoPlay
              loop
              playsInline
              preload="metadata"
              aria-label="Meridian video (muted by default)"
              ref={setVideoRef}
            />
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
              aria-label={muted ? 'Unmute video' : 'Mute video'}
              className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
              {muted ? 'Sound off' : 'Sound on'}
            </button>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">In motion</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient">Watch the ecosystem work.
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            A rolling look at the Meridian demo — markets, plans, and portfolio moving together.
            It plays silently until you choose to turn sound on.
          </p>
          <div className="mt-8">
            <Link
              to="/trading/demo"
              className="inline-flex min-w-[200px] items-center justify-center rounded-[4px] bg-[var(--color-accent)] px-7 py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90"
            >
              Try paper trading
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
