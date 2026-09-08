import type { Kysely } from 'kysely'
import type { Card, Database } from '@main/db/types'
import { State } from './fsrs'

export interface QueueOptions {
  moduleId: string
  now: Date
  dayStart: Date
  limit: number
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
    .execute()

  const reviewedToday = await db
    .selectFrom('review_log')
    .innerJoin('card', 'card.id', 'review_log.card_id')
    .select('card.concept_id')
    .where('card.module_id', '=', opt.moduleId)
    .where('review_log.ts', '>=', opt.dayStart.toISOString())
    .where('review_log.kind', '=', 'review')
    .execute()

  const buried = new Set(reviewedToday.map((r) => r.concept_id))

  const candidates = rows
    .filter((c) => rank(c, opt.now) <= 2)
    .sort((a, b) => {
      const r = rank(a, opt.now) - rank(b, opt.now)
      if (r !== 0) return r
      return a.due.localeCompare(b.due)
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

export async function countDue(
  db: Kysely<Database>,
  moduleId: string,
  now: Date
): Promise<{ dueToday: number; unseen: number; retired: number; learning: number }> {
  const rows = await db
    .selectFrom('card')
    .select(['state', 'due', 'retired_at', 'orphaned'])
    .where('module_id', '=', moduleId)
    .execute()
  let dueToday = 0
  let unseen = 0
  let retired = 0
  let learning = 0
  const iso = now.toISOString()
  for (const r of rows) {
    if (r.orphaned) continue
    if (r.retired_at) {
      retired++
      continue
    }
    if (r.state === State.New) unseen++
    else if (r.due <= iso) dueToday++
    else learning++
  }
  return { dueToday, unseen, retired, learning }
}
