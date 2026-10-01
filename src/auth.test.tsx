import { describe, it, expect, beforeEach } from 'vitest'
import { demoAdapter, setAuthAdapter } from './lib/auth'
import { useAuth } from './store/auth'

beforeEach(() => {
  localStorage.clear()
  setAuthAdapter(demoAdapter)
  useAuth.setState({ user: null, initialized: false, busy: false })
})

describe('demoAdapter', () => {
  it('signs up a new user with valid input', async () => {
    const { user, error } = await demoAdapter.signUp('Alex Morgan', 'alex@example.com', 'password123')
    expect(error).toBeNull()
    expect(user?.email).toBe('alex@example.com')
    expect(user?.name).toBe('Alex Morgan')
  })

  it('rejects invalid email', async () => {
    const { error } = await demoAdapter.signUp('Alex', 'not-an-email', 'password123')
    expect(error).toMatch(/valid email/)
  })

  it('rejects short passwords', async () => {
    const { error } = await demoAdapter.signUp('Alex', 'alex@example.com', 'short')
    expect(error).toMatch(/8 characters/)
  })

  it('rejects duplicate emails', async () => {
    await demoAdapter.signUp('Alex', 'alex@example.com', 'password123')
    const { error } = await demoAdapter.signUp('Alex Two', 'alex@example.com', 'password456')
    expect(error).toMatch(/already exists/)
  })

  it('signs in with correct credentials', async () => {
    await demoAdapter.signUp('Alex', 'alex@example.com', 'password123')
    await demoAdapter.signOut()
    const { user, error } = await demoAdapter.signIn('alex@example.com', 'password123')
    expect(error).toBeNull()
    expect(user?.email).toBe('alex@example.com')
  })

  it('rejects wrong password', async () => {
    await demoAdapter.signUp('Alex', 'alex@example.com', 'password123')
    const { user, error } = await demoAdapter.signIn('alex@example.com', 'wrongpassword')
    expect(user).toBeNull()
    expect(error).toMatch(/Incorrect/)
  })

  it('persists session across getSession calls', async () => {
    await demoAdapter.signUp('Alex', 'alex@example.com', 'password123')
    expect((await demoAdapter.getSession())?.email).toBe('alex@example.com')
    await demoAdapter.signOut()
    expect(await demoAdapter.getSession()).toBeNull()
  })
})

describe('useAuth store', () => {
  it('init restores session', async () => {
    await demoAdapter.signUp('Alex', 'alex@example.com', 'password123')
    useAuth.getState().init()
    await new Promise((r) => setTimeout(r, 10))
    expect(useAuth.getState().user?.email).toBe('alex@example.com')
    expect(useAuth.getState().initialized).toBe(true)
  })

  it('signUp sets user and returns null on success', async () => {
    const err = await useAuth.getState().signUp('Sam Lee', 'sam@example.com', 'password123')
    expect(err).toBeNull()
    expect(useAuth.getState().user?.name).toBe('Sam Lee')
  })

  it('signUp returns error string on failure', async () => {
    const err = await useAuth.getState().signUp('S', 'bad', 'short')
    expect(typeof err).toBe('string')
    expect(useAuth.getState().user).toBeNull()
  })

  it('signOut clears user', async () => {
    await useAuth.getState().signUp('Sam Lee', 'sam@example.com', 'password123')
    await useAuth.getState().signOut()
    expect(useAuth.getState().user).toBeNull()
  })

  it('supports swapping the adapter', async () => {
    const fake = {
      signUp: async () => ({ user: { id: 'x', name: 'Fake', email: 'f@x.com', createdAt: '' }, error: null }),
      signIn: async () => ({ user: null, error: 'nope' }),
      signOut: async () => {},
      getSession: async () => null,
      resetPassword: async () => ({ error: null }),
    }
    setAuthAdapter(fake)
    const err = await useAuth.getState().signUp('A', 'a@b.com', 'password123')
    expect(err).toBeNull()
    expect(useAuth.getState().user?.id).toBe('x')
    setAuthAdapter(demoAdapter)
  })

  it('demo adapter explains resetPassword is unavailable', async () => {
    const { error } = await demoAdapter.resetPassword('alex@example.com')
    expect(error).toMatch(/Supabase/)
  })

  it('store resetPassword returns null on success', async () => {
    const fake = {
      signUp: async () => ({ user: null, error: 'nope' }),
      signIn: async () => ({ user: null, error: 'nope' }),
      signOut: async () => {},
      getSession: async () => null,
      resetPassword: async () => ({ error: null }),
    }
    setAuthAdapter(fake)
    expect(await useAuth.getState().resetPassword('a@b.com')).toBeNull()
    setAuthAdapter(demoAdapter)
  })

  it('store resetPassword surfaces adapter errors', async () => {
    const err = await useAuth.getState().resetPassword('alex@example.com')
    expect(err).toMatch(/Supabase/)
  })
})
