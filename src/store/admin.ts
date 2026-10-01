import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/market'
import seedAssets from '../mock/assets.json'
import seedPlans from '../mock/plans.json'
import seedVehicles from '../mock/vehicles.json'
import seedGiveaways from '../mock/giveaways.json'

export const ADMIN_PIN = '1234'

// Money fields are normalized to 2 decimals everywhere settings are written
// or rehydrated: guards against float artifacts (e.g. 0.10000000149011612)
// that can linger in persisted storage from older builds.
const round2 = (n: number) => Math.round(n * 100) / 100
const cleanSettings = (s: PlatformSettings): PlatformSettings => ({
  ...s,
  tradingFeePct: round2(s.tradingFeePct),
  withdrawalFeeUSD: round2(s.withdrawalFeeUSD),
  minDepositUSD: round2(s.minDepositUSD),
})

export interface AdminUser {
  id: string
  name: string
  email: string
  tier: 'Standard' | 'Plus' | 'Elite'
  status: 'active' | 'suspended'
  joined: string
  balance: number
}

export interface AdminAsset {
  symbol: string
  name: string
  price: number
  changePct: number
  type: string
  sector?: string
  currency: string
}

export interface AdminPlan {
  id: string
  name: string
  minAmount: number
  riskLevel: string
  term: string
  tagline: string
  returnRange: [number, number]
}

export interface AdminVehicle {
  id: string
  name: string
  type: string
  price: number
  rangeKm: number
  seats: number
  drivetrain: string
  availability: string
}

export interface AdminGiveaway {
  id: string
  title: string
  prize: string
  entries: number
  status: 'active' | 'past'
  endsIn?: string
  winner?: string
}

export interface ActivityEntry {
  id: string
  action: string
  detail: string
  date: string
}

export interface PlatformSettings {
  platformName: string
  maintenanceMode: boolean
  demoBalance: number
  tradingFeePct: number
  withdrawalFeeUSD: number
  minDepositUSD: number
  allowSignups: boolean
}

const seedUsers: AdminUser[] = [
  { id: 'u1', name: 'Ava Chen', email: 'ava.chen@example.com', tier: 'Elite', status: 'active', joined: '2026-01-14', balance: 48250 },
  { id: 'u2', name: 'Liam Ortiz', email: 'liam.ortiz@example.com', tier: 'Plus', status: 'active', joined: '2026-02-03', balance: 18200 },
  { id: 'u3', name: 'Sofia Marino', email: 'sofia.m@example.com', tier: 'Standard', status: 'active', joined: '2026-03-21', balance: 5400 },
  { id: 'u4', name: 'Noah Kim', email: 'noah.kim@example.com', tier: 'Plus', status: 'suspended', joined: '2026-04-02', balance: 980 },
  { id: 'u5', name: 'Emma Wilson', email: 'emma.w@example.com', tier: 'Standard', status: 'active', joined: '2026-05-19', balance: 12300 },
  { id: 'u6', name: 'James Park', email: 'j.park@example.com', tier: 'Elite', status: 'active', joined: '2026-06-08', balance: 96400 },
  { id: 'u7', name: 'Olivia Davis', email: 'olivia.d@example.com', tier: 'Standard', status: 'active', joined: '2026-07-25', balance: 2100 },
  { id: 'u8', name: 'Ethan Brown', email: 'ethan.b@example.com', tier: 'Plus', status: 'active', joined: '2026-08-11', balance: 15750 },
]

interface AdminState {
  isAdmin: boolean
  login: (pin: string) => boolean
  /** Grants console access without a PIN (used for admin-role user sessions). */
  grant: () => void
  logout: () => void

  users: AdminUser[]
  updateUserStatus: (id: string, status: 'active' | 'suspended') => void
  updateUserTier: (id: string, tier: AdminUser['tier']) => void

  assets: AdminAsset[]
  upsertAsset: (asset: AdminAsset) => void
  deleteAsset: (symbol: string) => void

  plans: AdminPlan[]
  upsertPlan: (plan: AdminPlan) => void
  deletePlan: (id: string) => void

  vehicles: AdminVehicle[]
  upsertVehicle: (vehicle: AdminVehicle) => void
  deleteVehicle: (id: string) => void

  giveaways: AdminGiveaway[]
  upsertGiveaway: (g: AdminGiveaway) => void
  deleteGiveaway: (id: string) => void
  pickWinner: (id: string) => void

  settings: PlatformSettings
  updateSettings: (patch: Partial<PlatformSettings>) => void

  activity: ActivityEntry[]
  log: (action: string, detail: string) => void
  resetDemo: () => void
}

function toActivity(action: string, detail: string): ActivityEntry {
  return { id: uid('act'), action, detail, date: new Date().toISOString() }
}

function toAdminPlans(): AdminPlan[] {
  return (seedPlans as Array<Omit<AdminPlan, 'returnRange'> & { returnRange: number[] }>).map((p) => ({
    id: p.id,
    name: p.name,
    minAmount: p.minAmount,
    riskLevel: p.riskLevel,
    term: p.term,
    tagline: p.tagline,
    returnRange: [p.returnRange[0] ?? 0, p.returnRange[1] ?? 0] as [number, number],
  }))
}

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      isAdmin: false,
      login: (pin) => {
        if (pin === ADMIN_PIN) {
          set((s) => ({
            isAdmin: true,
            activity: [toActivity('Admin login', 'Signed in to admin console'), ...s.activity].slice(0, 200),
          }))
          return true
        }
        return false
      },
      logout: () => set({ isAdmin: false }),
      grant: () =>
        set((s) => ({
          isAdmin: true,
          activity: [toActivity('Admin login', 'Signed in via admin user session'), ...s.activity].slice(0, 200),
        })),

      users: seedUsers,
      updateUserStatus: (id, status) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, status } : u)),
          activity: [toActivity(status === 'suspended' ? 'User suspended' : 'User reactivated', id), ...s.activity].slice(0, 200),
        })),
      updateUserTier: (id, tier) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, tier } : u)),
          activity: [toActivity('Tier changed', `${id} → ${tier}`), ...s.activity].slice(0, 200),
        })),

      assets: seedAssets as AdminAsset[],
      upsertAsset: (asset) =>
        set((s) => {
          const exists = s.assets.some((a) => a.symbol === asset.symbol)
          return {
            assets: exists ? s.assets.map((a) => (a.symbol === asset.symbol ? asset : a)) : [...s.assets, asset],
            activity: [toActivity(exists ? 'Asset updated' : 'Asset added', asset.symbol), ...s.activity].slice(0, 200),
          }
        }),
      deleteAsset: (symbol) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.symbol !== symbol),
          activity: [toActivity('Asset removed', symbol), ...s.activity].slice(0, 200),
        })),

      plans: toAdminPlans(),
      upsertPlan: (plan) =>
        set((s) => {
          const exists = s.plans.some((p) => p.id === plan.id)
          return {
            plans: exists ? s.plans.map((p) => (p.id === plan.id ? plan : p)) : [...s.plans, plan],
            activity: [toActivity(exists ? 'Plan updated' : 'Plan added', plan.name), ...s.activity].slice(0, 200),
          }
        }),
      deletePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
          activity: [toActivity('Plan removed', id), ...s.activity].slice(0, 200),
        })),

      vehicles: seedVehicles as AdminVehicle[],
      upsertVehicle: (vehicle) =>
        set((s) => {
          const exists = s.vehicles.some((v) => v.id === vehicle.id)
          return {
            vehicles: exists ? s.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)) : [...s.vehicles, vehicle],
            activity: [toActivity(exists ? 'Vehicle updated' : 'Vehicle added', vehicle.name), ...s.activity].slice(0, 200),
          }
        }),
      deleteVehicle: (id) =>
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
          activity: [toActivity('Vehicle removed', id), ...s.activity].slice(0, 200),
        })),

      giveaways: seedGiveaways as AdminGiveaway[],
      upsertGiveaway: (g) =>
        set((s) => {
          const exists = s.giveaways.some((x) => x.id === g.id)
          return {
            giveaways: exists ? s.giveaways.map((x) => (x.id === g.id ? g : x)) : [...s.giveaways, g],
            activity: [toActivity(exists ? 'Giveaway updated' : 'Giveaway added', g.title), ...s.activity].slice(0, 200),
          }
        }),
      deleteGiveaway: (id) =>
        set((s) => ({
          giveaways: s.giveaways.filter((g) => g.id !== id),
          activity: [toActivity('Giveaway removed', id), ...s.activity].slice(0, 200),
        })),
      pickWinner: (id) =>
        set((s) => {
          const names = ['Ava Chen', 'Liam Ortiz', 'Sofia Marino', 'Emma Wilson', 'James Park', 'Olivia Davis']
          const winner = names[Math.floor(Math.random() * names.length)]
          return {
            giveaways: s.giveaways.map((g) => (g.id === id ? { ...g, status: 'past' as const, winner } : g)),
            activity: [toActivity('Winner picked', `${id} → ${winner}`), ...s.activity].slice(0, 200),
          }
        }),

      settings: {
        platformName: 'Meridian',
        maintenanceMode: false,
        demoBalance: 100000,
        tradingFeePct: 0.1,
        withdrawalFeeUSD: 5,
        minDepositUSD: 10,
        allowSignups: true,
      },
      updateSettings: (patch) =>
        set((s) => ({
          settings: cleanSettings({ ...s.settings, ...patch }),
          activity: [toActivity('Settings updated', Object.keys(patch).join(', ')), ...s.activity].slice(0, 200),
        })),

      activity: [toActivity('Console initialized', 'Demo admin data seeded')],
      log: (action, detail) =>
        set((s) => ({ activity: [toActivity(action, detail), ...s.activity].slice(0, 200) })),

      resetDemo: () =>
        set({
          users: seedUsers,
          assets: seedAssets as AdminAsset[],
          plans: toAdminPlans(),
          vehicles: seedVehicles as AdminVehicle[],
          giveaways: seedGiveaways as AdminGiveaway[],
          activity: [toActivity('Demo reset', 'All admin data restored to seed')],
        }),
    }),
    {
      name: 'meridian-admin',
      partialize: (s) => ({
        isAdmin: s.isAdmin,
        users: s.users,
        assets: s.assets,
        plans: s.plans,
        vehicles: s.vehicles,
        giveaways: s.giveaways,
        settings: s.settings,
        activity: s.activity,
      }) as AdminState,
      // Clean legacy float artifacts on rehydrate so a polluted persisted
      // value (e.g. tradingFeePct 0.10000000149011612) can never resurface.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AdminState>
        const merged = { ...current, ...p }
        if (p.settings) merged.settings = cleanSettings({ ...current.settings, ...p.settings })
        return merged
      },
    },
  ),
)
