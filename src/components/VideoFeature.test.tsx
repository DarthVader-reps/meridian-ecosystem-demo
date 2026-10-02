import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import VideoFeature from './VideoFeature'

function renderFeature() {
  render(
    <MemoryRouter>
      <VideoFeature />
    </MemoryRouter>,
  )
}

describe('VideoFeature', () => {
  it('autoplays muted and only unmutes on explicit user action', () => {
    renderFeature()
    const video = screen.getByLabelText('Meridian demo video (muted by default)') as HTMLVideoElement
    expect(video.muted).toBe(true)
    expect(video.hasAttribute('autoplay')).toBe(true)
    expect(video.hasAttribute('loop')).toBe(true)

    // Sound starts off…
    const unmute = screen.getByRole('button', { name: 'Unmute video' })
    expect(unmute.getAttribute('aria-pressed')).toBe('false')

    // …and only turns on when the user taps the toggle.
    fireEvent.click(unmute)
    expect(video.muted).toBe(false)
    const mute = screen.getByRole('button', { name: 'Mute video' })
    expect(mute.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(mute)
    expect(video.muted).toBe(true)
    expect(screen.getByRole('button', { name: 'Unmute video' })).toBeTruthy()
  })

  it('renders the gradient headline and CTA', () => {
    renderFeature()
    const headline = screen.getByText('Watch the ecosystem work.')
    expect(headline.className).toContain('text-gradient')
    expect(screen.getByRole('link', { name: 'Try demo trading' }).getAttribute('href')).toBe('/trading/demo')
  })
})
