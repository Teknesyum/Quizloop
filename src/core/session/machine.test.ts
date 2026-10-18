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
import { chapterCounts } from '@core/scheduler/queue'
import { SessionMachine } from './machine'

const NOW = new Date('2026-09-08T09:00:00.000Z')
const SAMPLE = resolve('src/core/testdata/ornek')

let dir: string
let db: Kysely<Database>
let close: () => void

async function machine(): Promise<SessionMachine> {
  const mod = await readMeta(nodePorts, SAMPLE)
  await syncModule(db, nodePorts, mod, NOW)
  const index = new QuestionIndex(nodePorts, mod)
  return new SessionMachine({
    db,
    indexFor: () => index,
    assetBase: (id) => `quizloop://module/${id}/`,
    dayStart: (now) => new Date(now.getTime() - 9 * 3600000),
    limit: () => 50,
    now: () => NOW,
    seed: () => 1
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
    expect(s.total).toBe(8)
    expect(s.first).not.toBeNull()
  })

  it('counts down the questions left and reports the partly understood ones', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    const id = s.sessionId
    expect(s.first!.left).toBe(8)
    const solve = (q: { choices: { key: 'A' | 'B' | 'C' | 'D' | 'E' }[] }): void => {
      m.reveal(id)
      for (const c of q.choices) if (m.answer(id, c.key).correct) break
    }
    solve(s.first!)
    let next = (await m.grade(id, 2, 100)).next
    expect(next!.left).toBe(7)
    solve(next!)
    next = (await m.grade(id, 1, 100)).next
    expect(next!.left).toBe(7)
    const left: number[] = []
    while (next) {
      left.push(next.left)
      solve(next)
      next = (await m.grade(id, 3, 100)).next
    }
    expect(left).toEqual([7, 6, 5, 4, 3, 2, 1])
    const sum = await m.end(id)
    expect(sum.partial).toBe(1)
    expect(sum.retired).toBe(7)
    const all = await chapterCounts(db, 'ornek', NOW, NOW)
    expect(all.reduce((n, r) => n + r.count.partial, 0)).toBe(1)
  })

  it('hands over every wrong choice explanation once the pick is right', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    m.reveal(s.sessionId)
    const keys = s.first!.choices.map((c) => c.key)
    let right: ReturnType<typeof m.answer> | null = null
    for (const k of keys) {
      const r = m.answer(s.sessionId, k)
      expect(r.correct ? r.explanation : r.distractors).toBeUndefined()
      if (r.correct) {
        right = r
        break
      }
    }
    expect(Object.keys(right?.distractors ?? {}).sort()).toEqual(
      keys.filter((k) => k !== right?.correctKey).sort()
    )
  })

  it('starts a session with only the partly understood cards', async () => {
    const m = await machine()
    const s = await m.start('ornek')
    m.reveal(s.sessionId)
    for (const c of s.first!.choices) if (m.answer(s.sessionId, c.key).correct) break
    await m.grade(s.sessionId, 2, 1000)
    await m.end(s.sessionId)
    const again = await m.start('ornek', null, true)
    expect(again.total).toBe(1)
    expect(again.first?.questionId).toBe(s.first!.questionId)
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

async function solveAndGrade(
  m: SessionMachine,
  id: string,
  q: { choices: { key: 'A' | 'B' | 'C' | 'D' | 'E' }[] },
  self: 1 | 2 | 3
): Promise<Awaited<ReturnType<SessionMachine['grade']>>> {
  m.reveal(id)
  for (const c of q.choices) if (m.answer(id, c.key).correct) break
  return m.grade(id, self, 300)
}

async function chapterOf(questionId: string): Promise<string> {
  const row = await db
    .selectFrom('card')
    .select(['chapter'])
    .where('question_id', '=', questionId)
    .executeTakeFirstOrThrow()
  return row.chapter ?? ''
}

describe('mixed session', () => {
  it('counts each answer against the chapter of its own question', async () => {
    const m = await machine()
    const before = await chapterCounts(db, 'ornek', NOW, NOW)
    const s = await m.start('ornek', null)
    const first = s.first!
    const g = await solveAndGrade(m, s.sessionId, first, 3)
    const second = g.next!
    await solveAndGrade(m, s.sessionId, second, 2)
    const after = await chapterCounts(db, 'ornek', NOW, NOW)
    const pick = (rows: typeof before, ch: string): (typeof before)[number] =>
      rows.find((r) => r.chapter === ch)!
    const a = await chapterOf(first.questionId)
    const b = await chapterOf(second.questionId)
    const touched = new Set([a, b])
    expect(pick(after, a).count.retired - pick(before, a).count.retired).toBe(1)
    expect(pick(after, a).used).not.toBeNull()
    expect(pick(after, b).count.partial - pick(before, b).count.partial).toBe(1)
    const unseen = (rows: typeof before): number =>
      [...touched].reduce((n, ch) => n + pick(rows, ch).count.unseen, 0)
    expect(unseen(before) - unseen(after)).toBe(2)
    for (const r of after)
      if (!touched.has(r.chapter)) expect(r.count).toEqual(pick(before, r.chapter).count)
    await m.end(s.sessionId)
    const chapter = await m.start('ornek', a)
    expect(chapter.total).toBe(pick(after, a).total - pick(after, a).count.retired)
  })

  it('leaves the same chapter counts a chapter session would', async () => {
    const m = await machine()
    const s = await m.start('ornek', null)
    const q = s.first!
    await solveAndGrade(m, s.sessionId, q, 2)
    const ch = await chapterOf(q.questionId)
    const mixed = await chapterCounts(db, 'ornek', NOW, NOW)

    const mainDb = db
    const second = await openDatabase(join(dir, 'chapter.db'))
    db = second.db
    try {
      const m2 = await machine()
      const c = await m2.start('ornek', ch)
      expect(c.first!.questionId).toBe(q.questionId)
      await solveAndGrade(m2, c.sessionId, c.first!, 2)
      expect(await chapterCounts(db, 'ornek', NOW, NOW)).toEqual(mixed)
    } finally {
      await second.db.destroy()
      db = mainDb
    }
  })
})

describe('chapterless questions', () => {
  it('start a session from the blank chapter row', async () => {
    const m = await machine()
    const card = await db.selectFrom('card').select(['id']).limit(1).executeTakeFirstOrThrow()
    await db.updateTable('card').set({ chapter: null }).where('id', '=', card.id).execute()
    const rows = await chapterCounts(db, 'ornek', NOW, NOW)
    expect(rows.find((r) => r.chapter === '')!.total).toBe(1)
    const s = await m.start('ornek', '')
    expect(s.total).toBe(1)
  })
})

describe('closing without End Session', () => {
  it('keeps every graded answer on disk and closes the open session at the last answer', async () => {
    const m = await machine()
    const s = await m.start('ornek', null)
    const g = await solveAndGrade(m, s.sessionId, s.first!, 3)
    await solveAndGrade(m, s.sessionId, g.next!, 2)

    const other = await openDatabase(join(dir, 'test.db'))
    try {
      const logs = await other.db.selectFrom('review_log').selectAll().execute()
      expect(logs.length).toBe(2)
      const cards = await other.db
        .selectFrom('card')
        .select(['question_id', 'retired_at', 'last_self_assess', 'reps'])
        .where('reps', '>', 0)
        .execute()
      expect(cards.map((c) => c.question_id).sort()).toEqual(
        [s.first!.questionId, g.next!.questionId].sort()
      )
      expect(cards.find((c) => c.question_id === s.first!.questionId)!.retired_at).not.toBeNull()
      const open = await other.db
        .selectFrom('session')
        .selectAll()
        .where('id', '=', s.sessionId)
        .executeTakeFirstOrThrow()
      expect(open.ended_at).toBeNull()
      expect(open.seen).toBe(2)

      const mod = await readMeta(nodePorts, SAMPLE)
      const index = new QuestionIndex(nodePorts, mod)
      const later = new Date(NOW.getTime() + 3600000)
      const reopened = new SessionMachine({
        db: other.db,
        indexFor: () => index,
        assetBase: (id) => `quizloop://module/${id}/`,
        dayStart: (now) => new Date(now.getTime() - 9 * 3600000),
        limit: () => 50,
        now: () => later,
        seed: () => 1
      })
      const next = await reopened.start('ornek', null)
      expect(next.total).toBe(7)
      const closed = await other.db
        .selectFrom('session')
        .selectAll()
        .where('id', '=', s.sessionId)
        .executeTakeFirstOrThrow()
      expect(closed.ended_at).toBe(NOW.toISOString())
      expect(closed.seen).toBe(2)
      const live = await other.db
        .selectFrom('session')
        .selectAll()
        .where('id', '=', next.sessionId)
        .executeTakeFirstOrThrow()
      expect(live.ended_at).toBeNull()
    } finally {
      await other.db.destroy()
    }
  })
})

describe('chapterCounts', () => {
  it('lists used chapters first, the most recent on top', async () => {
    await machine()
    const plain = await chapterCounts(db, 'ornek', NOW, NOW)
    expect(plain.length).toBeGreaterThan(1)
    expect(plain.every((r) => r.used === null)).toBe(true)
    const last = plain[plain.length - 1]!.chapter
    const first = plain[0]!.chapter
    const stamp = async (chapter: string, at: string): Promise<void> => {
      const card = await db
        .selectFrom('card')
        .select(['id'])
        .where('chapter', '=', chapter)
        .limit(1)
        .executeTakeFirstOrThrow()
      await db.updateTable('card').set({ last_review: at }).where('id', '=', card.id).execute()
    }
    await stamp(last, '2026-09-08T08:00:00.000Z')
    expect((await chapterCounts(db, 'ornek', NOW, NOW))[0]!.chapter).toBe(last)
    await stamp(first, '2026-09-08T08:30:00.000Z')
    const both = await chapterCounts(db, 'ornek', NOW, NOW)
    expect(both.slice(0, 2).map((r) => r.chapter)).toEqual([first, last])
  })
})
