import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import type { StatsOverview } from '@shared/ipc'

export async function statsOverview(
  db: Kysely<Database>,
  now: Date,
  dayStart: (at: Date) => Date
): Promise<StatsOverview> {
  const modules = await db
    .selectFrom('module')
    .select(db.fn.countAll<number>().as('n'))
    .executeTakeFirstOrThrow()
  const cards = await db
    .selectFrom('card')
    .select(db.fn.countAll<number>().as('n'))
    .where('orphaned', '=', 0)
    .executeTakeFirstOrThrow()
  const retired = await db
    .selectFrom('card')
    .select(db.fn.countAll<number>().as('n'))
    .where('retired_at', 'is not', null)
    .executeTakeFirstOrThrow()
  const dueToday = await db
    .selectFrom('card')
    .select(db.fn.countAll<number>().as('n'))
    .where('retired_at', 'is', null)
    .where('orphaned', '=', 0)
    .where('due', '<=', now.toISOString())
    .where('state', '!=', 0)
    .executeTakeFirstOrThrow()
  const reviewsTotal = await db
    .selectFrom('review_log')
    .select(db.fn.countAll<number>().as('n'))
    .where('kind', '!=', 'migration')
    .executeTakeFirstOrThrow()
  const since = new Date(now.getTime() - 182 * 86400000).toISOString()
  const logs = await db
    .selectFrom('review_log')
    .select(['ts', 'wrong_picks'])
    .where('kind', '!=', 'migration')
    .where('ts', '>=', since)
    .execute()
  const byDay = new Map<string, { reviews: number; correct: number }>()
  for (const l of logs) {
    const day = dayStart(new Date(l.ts)).toISOString().slice(0, 10)
    const e = byDay.get(day) ?? { reviews: 0, correct: 0 }
    e.reviews++
    if (l.wrong_picks === 0) e.correct++
    byDay.set(day, e)
  }
  const perDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }))
  const sevenAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
  const reviews7d = perDay.filter((d) => d.day >= sevenAgo).reduce((a, d) => a + d.reviews, 0)
  let streak = 0
  const cursor = dayStart(now)
  while (byDay.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  const stateRows = await db
    .selectFrom('card')
    .select(['module_id', 'state', 'retired_at', 'reps'])
    .where('orphaned', '=', 0)
    .execute()
  const states = { yeni: 0, ogreniyor: 0, tekrar: 0, emekli: 0 }
  const perModule = new Map<string, { total: number; seen: number; retired: number }>()
  for (const c of stateRows) {
    if (c.retired_at) states.emekli++
    else if (c.state === 0) states.yeni++
    else if (c.state === 2) states.tekrar++
    else states.ogreniyor++
    const m = perModule.get(c.module_id) ?? { total: 0, seen: 0, retired: 0 }
    m.total++
    if (c.reps > 0 || c.retired_at) m.seen++
    if (c.retired_at) m.retired++
    perModule.set(c.module_id, m)
  }
  const names = await db.selectFrom('module').select(['id', 'name']).orderBy('name').execute()
  const progress = names.map((n) => ({
    id: n.id,
    name: n.name,
    ...(perModule.get(n.id) ?? { total: 0, seen: 0, retired: 0 })
  }))
  return {
    states,
    progress,
    modules: Number(modules.n),
    cards: Number(cards.n),
    dueToday: Number(dueToday.n),
    reviewsTotal: Number(reviewsTotal.n),
    reviews7d,
    retired: Number(retired.n),
    streakDays: streak,
    perDay
  }
}
