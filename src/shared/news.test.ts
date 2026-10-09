import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NEWS, compareVersions, newsSince } from './news'

const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
  version: string
}

describe('news', () => {
  it('carries an entry for the version being released', () => {
    expect(NEWS[0]?.version).toBe(pkg.version)
  })

  it('lists versions newest first with both languages filled', () => {
    for (let i = 0; i < NEWS.length; i++) {
      const n = NEWS[i]!
      expect(n.tr.length).toBeGreaterThan(0)
      expect(n.en.length).toBe(n.tr.length)
      if (i > 0) expect(compareVersions(NEWS[i - 1]!.version, n.version)).toBeGreaterThan(0)
    }
  })

  it('compares versions by number, not by text', () => {
    expect(compareVersions('0.7.100', '0.7.63')).toBeGreaterThan(0)
    expect(compareVersions('0.8.0', '0.7.99')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
  })

  it('returns only what came after the last seen version', () => {
    const top = NEWS[0]!.version
    expect(newsSince(top, top)).toEqual([])
    expect(newsSince('', top).length).toBe(Math.min(3, NEWS.length))
    expect(newsSince(NEWS[1]!.version, top).map((n) => n.version)).toEqual([top])
    expect(newsSince('', '0.0.1')).toEqual([])
  })
})
