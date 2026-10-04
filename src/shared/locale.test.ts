import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const load = (lang: string): Record<string, string> =>
  JSON.parse(readFileSync(join(__dirname, '../../locale', `${lang}.json`), 'utf8'))

const HEADINGS = [
  'settings.about',
  'settings.transfer',
  'settings.updates',
  'stats.chart',
  'stats.heatmap',
  'stats.progress',
  'stats.states',
  'session.solution'
]

const isHeading = (key: string): boolean =>
  key.endsWith('.title') ||
  key.endsWith('Title') ||
  key.startsWith('work.task.') ||
  HEADINGS.includes(key)

const lowerStarts = (text: string, lang: string): string[] =>
  text
    .replace(/\{[^}]*\}/g, '')
    .split(/[\s-]+/)
    .filter((w) => /^\p{L}/u.test(w) && w.charAt(0) !== w.charAt(0).toLocaleUpperCase(lang))

describe('locale', () => {
  it('parses both files', () => {
    expect(() => load('tr')).not.toThrow()
    expect(() => load('en')).not.toThrow()
  })

  it('keeps the same keys in both languages', () => {
    expect(Object.keys(load('en')).sort()).toEqual(Object.keys(load('tr')).sort())
  })

  it.each(['tr', 'en'])('writes %s headings with every word capitalised', (lang) => {
    const bad = Object.entries(load(lang))
      .filter(([key, text]) => isHeading(key) && lowerStarts(text, lang).length > 0)
      .map(([key]) => key)
    expect(bad).toEqual([])
  })
})
