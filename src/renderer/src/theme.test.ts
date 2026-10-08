// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { THEMES, themeTokens } from './theme'

function parse(value: string): [number, number, number] {
  if (value.startsWith('#')) {
    const n = parseInt(value.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const m = value.match(/\d+/g)!.map(Number)
  return [m[0]!, m[1]!, m[2]!]
}

function luminance(c: [number, number, number]): number {
  const f = (v: number): number => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
}

function ratio(a: string, b: string): number {
  const x = luminance(parse(a))
  const y = luminance(parse(b))
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const TEXT = [
  '--tk-text',
  '--tk-text-muted',
  '--tk-text-label',
  '--tk-renk-2-text',
  '--tk-renk-3-text',
  '--tk-danger-text'
]
const FILLS = [
  ['--tk-on-renk-1', '--tk-renk-1'],
  ['--tk-on-renk-2', '--tk-renk-2'],
  ['--tk-on-renk-3', '--tk-renk-3'],
  ['--tk-on-success', '--tk-success'],
  ['--tk-on-danger', '--tk-danger']
] as const

describe('themes', () => {
  it('carries thirty-six themes with unique ids', () => {
    expect(THEMES).toHaveLength(36)
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(36)
  })

  it.each(THEMES.map((t) => [t.id, t] as const))('%s keeps text readable', (_id, th) => {
    const tokens = themeTokens(th)
    for (const name of TEXT) {
      expect(ratio(tokens[name]!, th.black), `${name} on bg`).toBeGreaterThanOrEqual(4.5)
      expect(ratio(tokens[name]!, th.surface), `${name} on surface`).toBeGreaterThanOrEqual(4.5)
    }
    for (const [fg, bg] of FILLS) {
      expect(ratio(tokens[fg]!, tokens[bg]!), `${fg}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
