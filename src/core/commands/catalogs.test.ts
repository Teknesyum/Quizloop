import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import { openDatabase } from '@main/db'
import { nodePorts } from '@main/ports'
import type { Database } from '@core/db/types'
import { checkFolder, syncFolder } from './modules'
import {
  installChannel,
  readCatalog,
  refreshCatalogs,
  type CatalogNet,
  type CatalogPackage
} from './catalogs'

const NOW = new Date('2026-10-10T09:00:00.000Z')
const SAMPLE = resolve('src/core/testdata/ornek')
const URL = 'https://ornek.dev/yayin/katalog.json'
const HASH = 'a'.repeat(64)

let dir: string
let db: Kysely<Database>
let close: () => void
let id: string
let version: string

function catalog(
  over: Record<string, unknown> = {},
  channel: Record<string, unknown> = {}
): string {
  return JSON.stringify({
    schemaVersion: 1,
    name: 'Deneme Kataloğu',
    publisher: 'Deneme Yayıncı',
    channels: [
      { id, name: 'Örnek', version, package: 'ornek.qlmod', size: 10, sha256: HASH, ...channel }
    ],
    ...over
  })
}

function net(text: string, asked: CatalogPackage[] = []): CatalogNet {
  return {
    text: async () => text,
    install: async (pkg) => {
      asked.push(pkg)
      return syncFolder(db, nodePorts, SAMPLE, NOW)
    }
  }
}

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'quizloop-catalogs-'))
  const opened = await openDatabase(join(dir, 'test.db'))
  db = opened.db
  close = () => opened.raw.close()
  const { meta } = await checkFolder(nodePorts, SAMPLE)
  id = meta.id
  version = meta.version
})

afterEach(async () => {
  await db.destroy()
  try {
    close()
  } catch {
    void 0
  }
  rmSync(dir, { recursive: true, force: true })
})

describe('readCatalog', () => {
  it('lists the channels of a catalog', async () => {
    const r = await readCatalog(net(catalog()), URL)
    expect(r.ok).toBe(true)
    expect(r.catalog?.channels.map((c) => c.id)).toEqual([id])
    expect(r.catalog?.publisher).toBe('Deneme Yayıncı')
  })

  it('names the fault instead of throwing', async () => {
    expect((await readCatalog(net(catalog()), 'http://ornek.dev/katalog.json')).fault).toBe(
      'address'
    )
    expect((await readCatalog(net('<html>'), URL)).fault).toBe('format')
    expect((await readCatalog(net(catalog({ schemaVersion: 2 })), URL)).fault).toBe('format')
    expect(
      (await readCatalog(net(catalog({}, { package: 'http://x.dev/a.qlmod' })), URL)).fault
    ).toBe('format')
    const down: CatalogNet = {
      text: async () => {
        throw new Error('offline')
      },
      install: async () => ({ ok: false })
    }
    expect((await readCatalog(down, URL)).fault).toBe('network')
  })
})

describe('installChannel', () => {
  it('downloads a channel that is not installed, with the package beside the catalog', async () => {
    const asked: CatalogPackage[] = []
    const r = await installChannel(db, net(catalog(), asked), URL, id)
    expect(r.ok).toBe(true)
    expect(asked).toEqual([
      { id, url: 'https://ornek.dev/yayin/ornek.qlmod', sha256: HASH, size: 10 }
    ])
  })

  it('skips the download when that version is already installed', async () => {
    await syncFolder(db, nodePorts, SAMPLE, NOW)
    const asked: CatalogPackage[] = []
    const r = await installChannel(db, net(catalog(), asked), URL, id)
    expect(r.ok).toBe(true)
    expect(asked).toEqual([])
  })

  it('reports a channel that left the catalog', async () => {
    const r = await installChannel(db, net(catalog()), URL, 'baska-kanal')
    expect(r).toEqual({ ok: false, error: 'missing' })
  })
})

describe('refreshCatalogs', () => {
  const subscribed = (
    channels: string[]
  ): { url: string; name: string; publisher: string; channels: string[] }[] => [
    { url: URL, name: 'Deneme Kataloğu', publisher: 'Deneme Yayıncı', channels }
  ]

  it('installs only what is newer than the installed version', async () => {
    await syncFolder(db, nodePorts, SAMPLE, NOW)
    const same: CatalogPackage[] = []
    expect(await refreshCatalogs(db, net(catalog(), same), subscribed([id]))).toEqual({
      updated: [],
      failed: 0
    })
    expect(same).toEqual([])
    const next: CatalogPackage[] = []
    const r = await refreshCatalogs(
      db,
      net(catalog({}, { version: '99.0.0' }), next),
      subscribed([id])
    )
    expect(r.updated).toEqual([{ moduleId: id, name: 'Örnek', version: '99.0.0' }])
    expect(next.length).toBe(1)
  })

  it('leaves a catalog alone when nothing in it is subscribed', async () => {
    const asked: CatalogPackage[] = []
    expect(await refreshCatalogs(db, net(catalog(), asked), subscribed([]))).toEqual({
      updated: [],
      failed: 0
    })
    expect(asked).toEqual([])
  })

  it('counts a catalog it cannot read and keeps going', async () => {
    const r = await refreshCatalogs(db, net('bozuk'), subscribed([id]))
    expect(r).toEqual({ updated: [], failed: 1 })
  })
})
