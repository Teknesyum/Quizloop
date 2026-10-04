import type { SettingsStore } from '@core/ports'
import { DEFAULT_SETTINGS } from '@core/settings'
import type { Settings } from '@shared/ipc'

const KEY = 'quizloop.settings'

export function loadSettings(): SettingsStore {
  let cache: Settings = { ...DEFAULT_SETTINGS }
  try {
    const value = localStorage.getItem(KEY)
    if (value) cache = { ...DEFAULT_SETTINGS, ...(JSON.parse(value) as Partial<Settings>) }
  } catch {
    cache = { ...DEFAULT_SETTINGS }
  }
  return {
    get: () => cache,
    set: (patch) => {
      cache = { ...cache, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(cache))
      } catch (e) {
        console.warn(`[quizloop] settings not saved ${String(e)}`)
      }
      return cache
    }
  }
}
