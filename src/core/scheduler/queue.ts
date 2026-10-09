import type { Kysely } from 'kysely'
import type { Card, Database } from '@core/db/types'
import { State } from './fsrs'

export interface QueueOptions {
  moduleId: string
  now: Date
  dayStart: Date
  limit: number
  seed?: number
  chapter?: string | null
  partial?: boolean
}

function jitter(seed: number, id: number): number {
  let h = (seed ^ id) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function rank(c: Card, now: Date): number {
  const due = new Date(c.due) <= now
  if (due && c.lapses >= 2) return 0
  if (due) return 1
  if (c.state === State.New) return 2
  if (c.last_self_assess === 2) return 3
  return 4
}

export async function buildQueue(db: Kysely<Database>, opt: QueueOptions): Promise<Card[]> {
  const rows = await db
    .selectFrom('card')
    .selectAll()
    .where('module_id', '=', opt.moduleId)
    .where('retired_at', 'is', null)
    .where('orphaned', '=', 0)
    .$if(opt.chapter != null, (qb) => qb.where('chapter', '=', opt.chapter as string))
    .execute()

  const reviewedToday = await db
    .selectFrom('review_log')
    .innerJoin('card', 'card.id', 'review_log.card_id')
    .select('card.concept_id')
    .where('card.module_id', '=', opt.moduleId)
    .where('review_log.ts', '>=', opt.dayStart.toISOString())
    .where('review_log.kind', '=', 'review')
    .execute()

  const buried = new Set(opt.partial ? [] : reviewedToday.map((r) => r.concept_id))

  const candidates = rows
    .filter((c) => (opt.partial ? c.last_self_assess === 2 : rank(c, opt.now) <= 2))
    .sort((a, b) => {
      const r = rank(a, opt.now) - rank(b, opt.now)
      if (r !== 0) return r
      if (opt.seed === undefined) return a.due.localeCompare(b.due)
      return jitter(opt.seed, a.id) - jitter(opt.seed, b.id)
    })

  const out: Card[] = []
  for (const c of candidates) {
    if (out.length >= opt.limit) break
    if (buried.has(c.concept_id)) continue
    buried.add(c.concept_id)
    out.push(c)
  }
  return out
}

export interface DueCount {
  dueToday: number
  unseen: number
  retired: number
  learning: number
  retiredToday: number
  partial: number
}

export async function chapterCounts(
  db: Kysely<Database>,
  moduleId: string,
  now: Date,
  start: Date
): Promise<{ chapter: string; total: number; used: string | null; count: DueCount }[]> {
  const rows = await db
    .selectFrom('card')
    .select([
      'state',
      'due',
      'retired_at',
      'orphaned',
      'chapter',
      'last_review',
      'last_self_assess'
    ])
    .where('module_id', '=', moduleId)
    .execute()
  const iso = now.toISOString()
  const day = start.toISOString()
  const map = new Map<string, { total: number; used: string | null; count: DueCount }>()
  for (const r of rows) {
    if (r.orphaned) continue
    const key = r.chapter ?? ''
    let e = map.get(key)
    if (!e) {
      e = {
        total: 0,
        used: null,
        count: { dueToday: 0, unseen: 0, retired: 0, learning: 0, retiredToday: 0, partial: 0 }
      }
      map.set(key, e)
    }
    e.total++
    for (const t of [r.last_review, r.retired_at]) if (t && (!e.used || t > e.used)) e.used = t
    if (!r.retired_at && r.last_self_assess === 2) e.count.partial++
    if (r.retired_at) {
      e.count.retired++
      if (r.retired_at >= day) e.count.retiredToday++
    } else if (r.state === State.New) e.count.unseen++
    else if (r.due <= iso) e.count.dueToday++
    else e.count.learning++
  }
  return [...map.entries()]
    .map(([chapter, v]) => ({ chapter, ...v }))
    .sort(
      (a, b) =>
        (b.used ?? '').localeCompare(a.used ?? '') ||
        a.chapter.localeCompare(b.chapter, 'tr', { numeric: true })
    )
}

export async function lastUse(
  db: Kysely<Database>,
  moduleId: string
): Promise<{ used: string | null; chapter: string | null }> {
  const rows = await db
    .selectFrom('card')
    .select(['chapter', 'last_review', 'retired_at'])
    .where('module_id', '=', moduleId)
    .where('orphaned', '=', 0)
    .execute()
  let used: string | null = null
  let chapter: string | null = null
  const open = new Set<string>()
  for (const r of rows) {
    if (!r.retired_at && r.chapter) open.add(r.chapter)
    for (const t of [r.last_review, r.retired_at]) {
      if (!t || (used && t <= used)) continue
      used = t
      chapter = r.chapter
    }
  }
  return { used, chapter: chapter && open.has(chapter) ? chapter : null }
}

export async function countDue(
  db: Kysely<Database>,
  moduleId: string,
  now: Date,
  start: Date
): Promise<DueCount> {
  const rows = await db
    .selectFrom('card')
    .select(['state', 'due', 'retired_at', 'orphaned', 'last_self_assess'])
    .where('module_id', '=', moduleId)
    .execute()
  let dueToday = 0
  let unseen = 0
  let retired = 0
  let learning = 0
  let retiredToday = 0
  let partial = 0
  const iso = now.toISOString()
  const day = start.toISOString()
  for (const r of rows) {
    if (r.orphaned) continue
    if (r.retired_at) {
      retired++
      if (r.retired_at >= day) retiredToday++
      continue
    }
    if (r.last_self_assess === 2) partial++
    if (r.state === State.New) unseen++
    else if (r.due <= iso) dueToday++
    else learning++
  }
  return { dueToday, unseen, retired, learning, retiredToday, partial }
}
