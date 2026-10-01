/* Authentication adapter interface.
 *
 * The app talks only to this interface. `demoAdapter` (localStorage) is the
 * default so the full signup/login/logout UX works today. To go production,
 * implement this interface against Supabase/Firebase/Clerk and call
 * `setAuthAdapter(supabaseAdapter)` once at startup — no page changes needed.
 *
 * DEMO ONLY: the demo adapter hashes passwords with a non-cryptographic hash
 * and stores everything in the browser. It is NOT real security.
 */

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResult {
  user: AuthUser | null
  error: string | null
}

export interface AuthAdapter {
  signUp(name: string, email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getSession(): AuthUser | null
}

interface StoredUser extends AuthUser {
  passwordHash: string
}

const USERS_KEY = 'meridian-demo-auth-users'
const SESSION_KEY = 'meridian-demo-auth-session'

// DEMO ONLY hash — do not use for real credentials.
function demoHash(input: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16)
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as StoredUser[]
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toAuthUser(u: StoredUser): AuthUser {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const demoAdapter: AuthAdapter = {
  async signUp(name, email, password) {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (cleanName.length < 2) return { user: null, error: 'Please enter your name.' }
    if (!isValidEmail(cleanEmail)) return { user: null, error: 'Please enter a valid email address.' }
    if (password.length < 8) return { user: null, error: 'Password must be at least 8 characters.' }

    const users = readUsers()
    if (users.some((u) => u.email === cleanEmail)) {
      return { user: null, error: 'An account with this email already exists. Try logging in.' }
    }
    const stored: StoredUser = {
      id: `demo-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      passwordHash: demoHash(`${cleanEmail}:${password}`),
    }
    users.push(stored)
    writeUsers(users)
    localStorage.setItem(SESSION_KEY, stored.id)
    return { user: toAuthUser(stored), error: null }
  },

  async signIn(email, password) {
    const cleanEmail = email.trim().toLowerCase()
    const users = readUsers()
    const found = users.find((u) => u.email === cleanEmail)
    if (!found || found.passwordHash !== demoHash(`${cleanEmail}:${password}`)) {
      return { user: null, error: 'Incorrect email or password.' }
    }
    localStorage.setItem(SESSION_KEY, found.id)
    return { user: toAuthUser(found), error: null }
  },

  async signOut() {
    localStorage.removeItem(SESSION_KEY)
  },

  getSession() {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const found = readUsers().find((u) => u.id === id)
    return found ? toAuthUser(found) : null
  },
}

let activeAdapter: AuthAdapter = demoAdapter

export function setAuthAdapter(adapter: AuthAdapter) {
  activeAdapter = adapter
}

export function getAuthAdapter(): AuthAdapter {
  return activeAdapter
}
