import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import { openDatabase } from '@main/db'
import { nodePorts } from '@main/ports'
import type { Database } from '@core/db/types'
import { QuestionIndex, readMeta } from '@core/modules/loader'
import { syncModule } from '@core/modules/sync'
import { SessionMachine } from '@core/session/machine'
import type { GradeResult, QuestionView } from '@shared/ipc'
import { historyPage, recentSessions } from './history'
import { Library } from './library'

const SAMPLE = resolve('src/core/testdata/ornek')

let dir: string
let db: Kysely<Database>
let close: () => void
let clock = new Date('2026-09-08T09:00:00.000Z')

let index: QuestionIndex

async function setup(): Promise<{ m: SessionMachine; library: Library }> {
  const mod = await readMeta(nodePorts, SAMPLE)
  await syncModule(db, nodePorts, mod, clock)
  index = new QuestionIndex(nodePorts, mod)
  const library = new Library(db, nodePorts)
  const m = new SessionMachine({
    db,
    indexFor: () => index,
    assetBase: (id) => `quizloop://module/${id}/`,
    dayStart: (now) => new Date(now.getTime() - 9 * 3600000),
    limit: () => 50,
    now: () => clock,
    seed: () => 1
  })
  return { m, library }
}

async function solve(
  m: SessionMachine,
  id: string,
  q: QuestionView,
  wrongFirst: boolean
): Promise<GradeResult> {
  m.reveal(id)
  const right = (await index.get(q.questionId))!.correct!
  const wrong = q.choices.map((c) => c.key).filter((k) => k !== right)
  for (const k of wrongFirst ? [...wrong, right] : [right]) if (m.answer(id, k).correct) break
  clock = new Date(clock.getTime() + 60000)
  return m.grade(id, 2, 100)
}

beforeEach(async () => {
  clock = new Date('2026-09-08T09:00:00.000Z')
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

describe('history', () => {
  it('lists answered questions newest first with the given answer, page by page', async () => {
    const { m, library } = await setup()
    const s = await m.start('ornek', null)
    const first = s.first!
    const g = await solve(m, s.sessionId, first, false)
    await solve(m, s.sessionId, g.next!, true)
    await m.end(s.sessionId)

    const page = await historyPage({ db, library }, 0, 1)
    expect(page.total).toBe(2)
    expect(page.items).toHaveLength(1)
    const newest = page.items[0]!
    expect(newest.questionId).toBe(g.next!.questionId)
    expect(newest.stem.length).toBeGreaterThan(0)
    expect(newest.answer).not.toBeNull()
    expect(newest.correct).toBe(false)
    expect(newest.answer).not.toBe(newest.correctKey)

    const next = await historyPage({ db, library }, 1, 1)
    expect(next.items[0]!.questionId).toBe(first.questionId)
    expect(next.items[0]!.correct).toBe(true)
    expect(next.items[0]!.answer).toBe(next.items[0]!.correctKey)
  })

  it('names the chapter of the latest sessions and skips empty ones', async () => {
    const { m } = await setup()
    const mixed = await m.start('ornek', null)
    await solve(m, mixed.sessionId, mixed.first!, false)
    await m.end(mixed.sessionId)
    clock = new Date(clock.getTime() + 60000)
    const chapter = await m.start('ornek', 'Oturum akışı')
    await solve(m, chapter.sessionId, chapter.first!, false)
    await m.end(chapter.sessionId)
    clock = new Date(clock.getTime() + 60000)
    const empty = await m.start('ornek', 'FSRS')
    await m.end(empty.sessionId)

    const recent = await recentSessions({ db, library: new Library(db, nodePorts) })
    expect(recent).toHaveLength(2)
    expect(recent[0]!.chapter).toBe('Oturum akışı')
    expect(recent[0]!.mixed).toBe(false)
    expect(recent[0]!.total).toBe(4)
    expect(recent[1]!.mixed).toBe(true)
    expect(recent[1]!.total).toBe(8)
    expect(recent[1]!.seen).toBe(1)
  })
})
