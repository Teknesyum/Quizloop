import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import { openDatabase } from '@main/db'
import { nodePorts } from '@main/ports'
import type { Database } from '@core/db/types'
import { ModuleMeta } from '@shared/schema/module'
import { hashText, type LoadedModule } from './loader'
import { syncModule } from './sync'
import type { CorePorts } from '@core/ports'

const NOW = new Date('2026-09-08T09:00:00.000Z')
const SAMPLE = resolve('modules/_ornek')
const ROOT = '/mem/big'

let dir: string
let db: Kysely<Database>
let close: () => void

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'quizloop-sync-'))
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

async function bigModule(copies: number): Promise<{ ports: CorePorts; mod: LoadedModule }> {
  const block = JSON.parse(readFileSync(join(SAMPLE, 'blocks/0001.json'), 'utf8')) as {
    blockId: string
    questions: { id: string }[]
  }
  const files = new Map<string, string>()
  const refs: { file: string; count: number; sha256: string }[] = []
  for (let n = 0; n < copies; n++) {
    const text = JSON.stringify({
      ...block,
      questions: block.questions.map((q) => ({ ...q, id: `${q.id}-${n}` }))
    })
    const file = `blocks/${String(n + 1).padStart(4, '0')}.json`
    files.set(`${ROOT}/${file}`, text)
    refs.push({ file, count: block.questions.length, sha256: await hashText(nodePorts, text) })
  }
  const meta = ModuleMeta.parse({
    ...JSON.parse(readFileSync(join(SAMPLE, 'module.json'), 'utf8')),
    id: 'big',
    blocks: refs,
    questionCount: copies * block.questions.length
  })
  const ports: CorePorts = {
    ...nodePorts,
    readText: async (p) => files.get(p) ?? '',
    exists: async (p) => files.has(p)
  }
  return { ports, mod: { meta, root: ROOT } }
}

describe('syncModule', () => {
  it('adds every card when the inserts are batched', async () => {
    const { ports, mod } = await bigModule(20)
    const first = await syncModule(db, ports, mod, NOW)
    expect(first.added).toBe(mod.meta.questionCount)
    const count = await db
      .selectFrom('card')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('module_id', '=', 'big')
      .executeTakeFirstOrThrow()
    expect(Number(count.n)).toBe(mod.meta.questionCount)
    const again = await syncModule(db, ports, mod, NOW)
    expect(again.added).toBe(0)
  })
})
