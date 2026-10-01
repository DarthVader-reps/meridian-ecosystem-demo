import { describe, expect, it } from 'vitest'
import { parseRecoveryTokens } from './supabase'

describe('parseRecoveryTokens', () => {
  it('extracts tokens from a HashRouter recovery URL', () => {
    const hash =
      '#/reset-password#access_token=AAA&expires_in=3600&refresh_token=BBB&token_type=bearer&type=recovery'
    expect(parseRecoveryTokens(hash)).toEqual({ access_token: 'AAA', refresh_token: 'BBB' })
  })

  it('returns null when there is no Supabase fragment', () => {
    expect(parseRecoveryTokens('#/reset-password')).toBeNull()
    expect(parseRecoveryTokens('#/login')).toBeNull()
    expect(parseRecoveryTokens('')).toBeNull()
  })

  it('returns null when the type is not recovery', () => {
    expect(
      parseRecoveryTokens('#/reset-password#access_token=AAA&refresh_token=BBB&type=signup'),
    ).toBeNull()
  })

  it('returns null when tokens are missing', () => {
    expect(parseRecoveryTokens('#/reset-password#type=recovery')).toBeNull()
    expect(parseRecoveryTokens('#/reset-password#access_token=AAA&type=recovery')).toBeNull()
  })
})
