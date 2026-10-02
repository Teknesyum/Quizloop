import { describe, expect, it } from 'vitest'
import type { CorePorts } from '@core/ports'
import { sourceBook, type BookResolver } from './source'
import type { Library } from './library'

const meta = {
  schemaVersion: 1,
  id: 'kitap',
  name: 'Kitap',
  version: '1.0.0',
  source: {
    title: 'Kitap',
    file: 'Kitap.pdf',
    pages: 40,
    sayfaOfseti: 4,
    bolumler: [
      { bolum: 1, ilkSayfa: 5, sonSayfa: 20, dosya: 'kaynak/bolum/01.pdf' },
      { bolum: 2, ilkSayfa: 21, sonSayfa: 40, dosya: 'kaynak/bolum/02.pdf' }
    ]
  },
  blocks: [{ file: 'blocks/0001.json', count: 1, sha256: 'a'.repeat(64) }],
  questionCount: 1,
  createdAt: '2026-10-02T00:00:00.000Z'
}

const ports: CorePorts = {
  readText: async () => JSON.stringify(meta),
  exists: async () => true,
  sha256: async () => '',
  now: () => new Date()
}

const library = { rootOf: () => '/m/kitap' } as unknown as Library

describe('sourceBook', () => {
  it('links chapter parts when the shell serves module files', async () => {
    const books: BookResolver = {
      path: () => null,
      url: () => '',
      file: (root, rel) => `https://x${root}/${rel}`
    }
    const b = await sourceBook({ ports, library, books }, 'kitap')
    expect(b.available).toBe(true)
    expect(b.url).toBeNull()
    expect(b.parts?.[1]).toEqual({
      bolum: 2,
      ilkSayfa: 21,
      sonSayfa: 40,
      url: 'https://x/m/kitap/kaynak/bolum/02.pdf'
    })
  })

  it('keeps the whole book on desktop and ignores parts', async () => {
    const books: BookResolver = { path: () => '/b/Kitap.pdf', url: () => 'quizloop://kaynak/kitap' }
    const b = await sourceBook({ ports, library, books }, 'kitap')
    expect(b.url).toBe('quizloop://kaynak/kitap')
    expect(b.parts).toBeNull()
  })
})
