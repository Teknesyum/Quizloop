import { Preferences } from '@capacitor/preferences'
import type { SettingsStore } from '@core/ports'
import { DEFAULT_SETTINGS } from '@core/settings'
import type { Settings } from '@shared/ipc'

const KEY = 'settings'

export async function loadSettings(): Promise<SettingsStore> {
  let cache: Settings = { ...DEFAULT_SETTINGS }
  try {
    const { value } = await Preferences.get({ key: KEY })
    if (value) cache = { ...DEFAULT_SETTINGS, ...(JSON.parse(value) as Partial<Settings>) }
  } catch {
    cache = { ...DEFAULT_SETTINGS }
  }
  return {
    get: () => cache,
    set: async (patch) => {
      const next = { ...cache, ...patch }
      await Preferences.set({ key: KEY, value: JSON.stringify(next) })
      cache = next
      return next
    }
  }
}
