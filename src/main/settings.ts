import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SettingsStore } from '@core/ports'
import { DEFAULT_SETTINGS } from '@core/settings'
import type { Settings } from '@shared/ipc'

let cache: Settings | null = null

function file(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): Settings {
  if (cache) return cache
  try {
    const raw = JSON.parse(readFileSync(file(), 'utf8')) as Partial<Settings>
    cache = { ...DEFAULT_SETTINGS, ...raw }
  } catch {
    cache = { ...DEFAULT_SETTINGS }
  }
  return cache
}

export function setSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  const target = file()
  mkdirSync(join(target, '..'), { recursive: true })
  const tmp = target + '.tmp'
  writeFileSync(tmp, JSON.stringify(next, null, 2))
  renameSync(tmp, target)
  cache = next
  return next
}

export function modulesDir(): string {
  const s = getSettings()
  const dir = s.modulesDir ?? join(app.getPath('userData'), 'modules')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export const settingsStore: SettingsStore = { get: getSettings, set: setSettings }
