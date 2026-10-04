import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseState, type KodState } from '@core/kod'

export function kodRoot(): string {
  return join(app.getPath('userData'), 'kod')
}

export function readState(): KodState | null {
  try {
    return parseState(readFileSync(join(kodRoot(), 'durum.json'), 'utf8'))
  } catch {
    return null
  }
}

export function writeState(state: KodState): void {
  mkdirSync(kodRoot(), { recursive: true })
  writeFileSync(join(kodRoot(), 'durum.json'), JSON.stringify(state))
}

export function markHealthy(): void {
  const state = readState()
  if (state && state.tries > 0 && state.version === app.getVersion()) {
    writeState({ ...state, tries: 0 })
  }
}
