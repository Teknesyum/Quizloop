import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const load = (lang: string): Record<string, string> =>
  JSON.parse(readFileSync(join(__dirname, '../../locale', `${lang}.json`), 'utf8'))

describe('locale', () => {
  it('parses both files', () => {
    expect(() => load('tr')).not.toThrow()
    expect(() => load('en')).not.toThrow()
  })

  it('keeps the same keys in both languages', () => {
    expect(Object.keys(load('en')).sort()).toEqual(Object.keys(load('tr')).sort())
  })
})
