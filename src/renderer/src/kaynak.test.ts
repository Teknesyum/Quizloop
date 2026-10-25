// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { SourceBook } from '@shared/ipc'
import { kaynakGoster, kitapta, kodGoster } from './kaynak'

const book = (file: string | null, available = true): SourceBook => ({
  available,
  url: null,
  path: null,
  sayfaOfseti: 0,
  pages: null,
  file
})

describe('kitapta', () => {
  it('opens the book only for questions drawn from the module book', () => {
    expect(kitapta(book('kitap.pdf'), 'kitap.pdf')).toBe(true)
    expect(kitapta(book('kitap.pdf'), 'kilavuz-2026')).toBe(false)
  })

  it('keeps old behaviour when the module names no file', () => {
    expect(kitapta(book(null), 'herhangi.pdf')).toBe(true)
  })

  it('never opens a missing book', () => {
    expect(kitapta(null, 'kitap.pdf')).toBe(false)
    expect(kitapta(book('kitap.pdf', false), 'kitap.pdf')).toBe(false)
  })
})

describe('kodGoster', () => {
  it('swaps the source quote for the code toggle on code questions', () => {
    expect(kodGoster(['kod'])).toBe(true)
    expect(kaynakGoster(['kod'])).toBe(false)
    expect(kaynakGoster([])).toBe(true)
  })
})
