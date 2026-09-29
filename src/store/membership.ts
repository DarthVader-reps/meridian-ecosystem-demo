import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MemberTier = 'standard' | 'plus' | 'elite'
export type VipTier = 'none' | 'silver' | 'gold' | 'platinum'

interface MembershipState {
  tier: MemberTier
  vip: VipTier
  setTier: (t: MemberTier) => void
  setVip: (v: VipTier) => void
  giveawayEntries: string[]
  enterGiveaway: (id: string) => void
}

export const useMembership = create<MembershipState>()(
  persist(
    (set) => ({
      tier: 'standard',
      vip: 'none',
      setTier: (tier) => set({ tier }),
      setVip: (vip) => set({ vip }),
      giveawayEntries: [],
      enterGiveaway: (id) => set((s) => (s.giveawayEntries.includes(id) ? s : { giveawayEntries: [...s.giveawayEntries, id] })),
    }),
    { name: 'meridian-membership' },
  ),
)
