import { describe, expect, it } from 'vitest'
import {
  kodManifest,
  offers,
  parseState,
  safeEntry,
  stale,
  usable,
  type KodManifest,
  type KodState
} from './kod'

const K = 'a1b2c3d4e5f6a7b8'
const OTHER = 'ffffffffffffffff'
const state = (version: string, tries = 0, kabuk = K): KodState => ({ version, kabuk, tries })
const manifest = (version: string, kabuk = K): KodManifest => ({
  version,
  kabuk,
  file: `kod-${version}.zip`,
  sha512: 'a'.repeat(128),
  size: 10
})

describe('usable', () => {
  it('takes a newer bundle built for this shell', () => {
    expect(usable(state('0.8.0'), '0.7.9', K)).toBe(true)
  })
  it('refuses when there is no state', () => {
    expect(usable(null, '0.7.9', K)).toBe(false)
  })
  it('refuses a bundle that is not newer than the installed code', () => {
    expect(usable(state('0.7.9'), '0.7.9', K)).toBe(false)
    expect(usable(state('0.7.8'), '0.7.9', K)).toBe(false)
  })
  it('refuses a bundle built for another shell', () => {
    expect(usable(state('0.8.0', 0, OTHER), '0.7.9', K)).toBe(false)
  })
  it('refuses a bundle that failed to start twice', () => {
    expect(usable(state('0.8.0', 1), '0.7.9', K)).toBe(true)
    expect(usable(state('0.8.0', 2), '0.7.9', K)).toBe(false)
  })
})

describe('stale', () => {
  it('keeps a failed bundle as a marker while it is still newer', () => {
    expect(stale(state('0.8.0', 2), '0.7.9', K)).toBe(false)
  })
  it('drops a bundle the installer has overtaken', () => {
    expect(stale(state('0.8.0'), '0.9.0', K)).toBe(true)
    expect(stale(state('0.9.1', 0, OTHER), '0.9.0', K)).toBe(true)
  })
})

describe('offers', () => {
  it('offers a newer bundle for the same shell', () => {
    expect(offers(manifest('0.8.0'), '0.7.9', K, null)).toBe(true)
  })
  it('leaves another shell to the installer', () => {
    expect(offers(manifest('0.8.0', OTHER), '0.7.9', K, null)).toBe(false)
  })
  it('does not offer the running version', () => {
    expect(offers(manifest('0.7.9'), '0.7.9', K, null)).toBe(false)
  })
  it('does not offer a bundle that already failed', () => {
    expect(offers(manifest('0.8.0'), '0.7.9', K, state('0.8.0', 2))).toBe(false)
    expect(offers(manifest('0.8.1'), '0.7.9', K, state('0.8.0', 2))).toBe(true)
  })
})

describe('parseState', () => {
  it('reads a valid state and rejects the rest', () => {
    expect(parseState(JSON.stringify(state('0.8.0')))).toEqual(state('0.8.0'))
    expect(parseState('{')).toBeNull()
    expect(parseState(JSON.stringify({ version: '../x', kabuk: K, tries: 0 }))).toBeNull()
  })
})

describe('kodManifest', () => {
  it('rejects a file name that leaves the release', () => {
    const bad = { ...manifest('0.8.0'), file: '../kod-0.8.0.zip' }
    expect(kodManifest.safeParse(bad).success).toBe(false)
    expect(kodManifest.safeParse(manifest('0.8.0')).success).toBe(true)
  })
})

describe('safeEntry', () => {
  it('allows only out and resources', () => {
    expect(safeEntry('out/main/index.js')).toBe(true)
    expect(safeEntry('resources/icon.png')).toBe(true)
    expect(safeEntry('node_modules/x/index.js')).toBe(false)
  })
  it('blocks paths that climb out', () => {
    expect(safeEntry('out/../../evil.js')).toBe(false)
    expect(safeEntry('/out/main/index.js')).toBe(false)
    expect(safeEntry('out\\..\\evil.js')).toBe(false)
    expect(safeEntry('C:/out/x.js')).toBe(false)
  })
})
