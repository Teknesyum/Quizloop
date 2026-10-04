import { app } from 'electron'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import Module, { createRequire } from 'node:module'
import { delimiter, join } from 'node:path'
import { KOD_TRIES, stale, usable, type KodState } from '@core/kod'
import { kodRoot, readState, writeState } from './kodstate'

const load = createRequire(__filename)

function entryOf(state: KodState): string {
  return join(kodRoot(), state.version, 'out', 'main', 'index.js')
}

function sweep(keep: string | null): void {
  let names: string[] = []
  try {
    names = readdirSync(kodRoot())
  } catch {
    return
  }
  for (const name of names) {
    if (keep !== null && (name === keep || name === 'durum.json')) continue
    try {
      rmSync(join(kodRoot(), name), { recursive: true, force: true })
    } catch {
      continue
    }
  }
}

function pick(): KodState | null {
  if (!app.isPackaged || process.platform !== 'win32') return null
  const state = readState()
  if (!state) return null
  const bundled = app.getVersion()
  if (stale(state, bundled, __KABUK__)) {
    sweep(null)
    return null
  }
  if (!usable(state, bundled, __KABUK__) || !existsSync(entryOf(state))) return null
  return state
}

const state = pick()
if (!state) load('./index.js')
else {
  if (app.requestSingleInstanceLock()) {
    sweep(state.version)
    writeState({ ...state, tries: state.tries + 1 })
  }
  process.env['NODE_PATH'] = [join(app.getAppPath(), 'node_modules'), process.env['NODE_PATH']]
    .filter(Boolean)
    .join(delimiter)
  ;(Module as unknown as { _initPaths(): void })._initPaths()
  app.getVersion = () => state.version
  try {
    load(entryOf(state))
  } catch {
    writeState({ ...state, tries: KOD_TRIES })
    app.relaunch()
    app.exit(0)
  }
}
