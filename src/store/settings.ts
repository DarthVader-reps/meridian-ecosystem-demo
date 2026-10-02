import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Platform display settings. This is the only shared configuration the
 * site build carries: the environment banner and maintenance-mode notice.
 * There is no admin console in this build — approvals, blocks and
 * suspensions are handled outside the site.
 */
export interface PlatformSettings {
  maintenanceMode: boolean
  /** Controls the top "Preview environment · Simulated funds" banner. */
  showEnvBanner: boolean
}

const DEFAULTS: PlatformSettings = { maintenanceMode: false, showEnvBanner: true }

/**
 * One-time migration from the retired admin store's persisted key, so a
 * visitor who toggled the banner keeps their preference.
 */
function migrateLegacy(): PlatformSettings {
  try {
    const raw = localStorage.getItem('meridian-admin')
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as { state?: { settings?: Partial<PlatformSettings> } }
    const s = parsed.state?.settings
    if (!s) return DEFAULTS
    return {
      maintenanceMode: s.maintenanceMode === true,
      showEnvBanner: s.showEnvBanner !== false,
    }
  } catch {
    return DEFAULTS
  }
}

interface SettingsState {
  settings: PlatformSettings
  updateSettings: (patch: Partial<PlatformSettings>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: migrateLegacy(),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'meridian-settings' },
  ),
)
