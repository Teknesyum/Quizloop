import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import { openDatabase } from '@main/db'
import { nodePorts } from '@main/ports'
import type { Database } from '@core/db/types'
import { checkFolder, syncFolder, versionChange } from './modules'

const NOW = new Date('2026-10-04T09:00:00.000Z')
const SAMPLE = resolve('src/core/testdata/ornek')

let dir: string
let db: Kysely<Database>
let close: () => void

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'quizloop-modules-'))
  const opened = await openDatabase(join(dir, 'test.db'))
  db = opened.db
  close = () => opened.raw.close()
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

describe('versionChange', () => {
  it('stays silent for a module that is not installed', async () => {
    const { meta } = await checkFolder(nodePorts, SAMPLE)
    expect(await versionChange(db, meta)).toBeNull()
  })

  it('stays silent when the same version is installed again', async () => {
    const { meta } = await checkFolder(nodePorts, SAMPLE)
    await syncFolder(db, nodePorts, SAMPLE, NOW)
    expect(await versionChange(db, meta)).toBeNull()
  })

  it('reports an upgrade and a downgrade with both versions', async () => {
    const { meta } = await checkFolder(nodePorts, SAMPLE)
    await syncFolder(db, nodePorts, SAMPLE, NOW)
    const up = await versionChange(db, { ...meta, version: '99.0.0' })
    expect(up).toEqual({
      moduleId: meta.id,
      name: meta.name,
      from: meta.version,
      to: '99.0.0',
      newer: true
    })
    const down = await versionChange(db, { ...meta, version: '0.0.1' })
    expect(down?.newer).toBe(false)
    expect(down?.to).toBe('0.0.1')
  })
})
