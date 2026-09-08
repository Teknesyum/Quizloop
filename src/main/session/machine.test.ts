import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import { openDatabase } from '@main/db'
import type { Database } from '@main/db/types'
import { QuestionIndex, readMeta } from '@main/modules/loader'
import { syncModule } from '@main/modules/sync'
import { SessionMachine } from './machine'

const NOW = new Date('2026-09-08T09:00:00.000Z')
const SAMPLE = resolve('modules/_ornek')

let dir: string
let db: Kysely<Database>
let close: () => void

async function machine(): Promise<SessionMachine> {
  const mod = readMeta(SAMPLE)
  await syncModule(db, mod, NOW)
  const index = new QuestionIndex(mod)
  return new SessionMachine({
    db,
    indexFor: () => index,
    assetBase: (id) => `quizloop://module/${id}/`,
    dayStart: (now) => new Date(now.getTime() - 9 * 3600000),
    limit: () => 50,
    now: () => NOW
  })
}

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'quizloop-'))
  const opened = await openDatabase(join(dir, 'test.db'))
  db = opened.db
  close = () => opened.raw.close()
})

afterEach(async () => {
  await db.destroy()
  try {
    close()
  } catch {
    /* already closed by kysely */
  }
  rmSync(dir, { recursive: true, force: true })
})

describe('openDatabase', () => {
  it('opens clean and applies every migration', async () => {
    const opened = await openDatabase(join(dir, 'second.db'))
    expect(opened.integrity.ok).toBe(true)
    expect(opened.migrated.length).toBeGreaterThan(0)
    await opened.db.destroy()
  })
})

describe('SessionMachine', () => {
  it('queues the whole sample module', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    expect(s.total).toBe(5)
    expect(s.first).not.toBeNull()
  })

  it('never leaks the correct key before the pick is right', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    m.reveal(s.sessionId)
    const first = s.first!
    const wrongKey = first.choices
      .map((c) => c.key)
      .find((k) => {
        try {
          return m.answer(s.sessionId, k).correct === false
        } catch {
          return false
        }
      })
    expect(wrongKey).toBeDefined()
  })

  it('brings a card back in the same session when the answer is "anlamadım"', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    const id = s.sessionId
    const target = s.first!.questionId

    m.reveal(id)
    for (const c of s.first!.choices) {
      const r = m.answer(id, c.key)
      if (r.correct) break
    }
    const g = await m.grade(id, 1, 1000)
    expect(g.retired).toBe(false)
    expect(m.pending(id).relearn).toBe(1)

    const seen: string[] = []
    let next = g.next
    while (next) {
      seen.push(next.questionId)
      m.reveal(id)
      for (const c of next.choices) {
        if (m.answer(id, c.key).correct) break
      }
      next = (await m.grade(id, 3, 500)).next
    }
    expect(seen).toContain(target)
    expect(seen.filter((x) => x === target).length).toBe(1)
  })

  it('retires a card on "anladım" and does not requeue it', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    const id = s.sessionId
    const target = s.first!.questionId

    m.known(id)
    m.reveal(id)
    for (const c of s.first!.choices) {
      if (m.answer(id, c.key).correct) break
    }
    const g = await m.grade(id, 3, 800)
    expect(g.retired).toBe(true)
    expect(m.pending(id).relearn).toBe(0)

    const row = await db
      .selectFrom('card')
      .select(['retired_at'])
      .where('question_id', '=', target)
      .executeTakeFirstOrThrow()
    expect(row.retired_at).not.toBeNull()
  })

  it('writes one review_log row per graded answer', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    const id = s.sessionId
    m.reveal(id)
    for (const c of s.first!.choices) {
      if (m.answer(id, c.key).correct) break
    }
    await m.grade(id, 2, 1200)
    const rows = await db.selectFrom('review_log').selectAll().execute()
    expect(rows.length).toBe(1)
    expect(rows[0]!.self_assess).toBe(2)
  })

  it('ends with a summary that matches the session row', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    const id = s.sessionId
    m.reveal(id)
    for (const c of s.first!.choices) {
      if (m.answer(id, c.key).correct) break
    }
    await m.grade(id, 3, 400)
    const sum = await m.end(id)
    expect(sum.seen).toBe(1)
    expect(sum.retired).toBe(1)
    const row = await db
      .selectFrom('session')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow()
    expect(row.ended_at).not.toBeNull()
    expect(row.score).toBe(sum.score)
  })
})
