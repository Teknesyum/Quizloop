import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { HISTORY_PAGE, type HistoryItem, type HistoryPage, type RecentSession } from '@shared/ipc'
import type { ChoiceKey, Question } from '@shared/schema/question'
import { plain } from './bank'
import type { Library } from './library'

export interface HistoryDeps {
  db: Kysely<Database>
  library: Library
}

function clamp(n: number | undefined, fallback: number, max: number): number {
  const v = Math.round(Number(n ?? fallback))
  return Number.isFinite(v) ? Math.max(1, Math.min(max, v)) : fallback
}

async function soleChapter(
  db: Kysely<Database>,
  sessionId: string
): Promise<{ chapter: string | null; mixed: boolean }> {
  const rows = await db
    .selectFrom('review_log')
    .innerJoin('card', 'card.id', 'review_log.card_id')
    .select('card.chapter')
    .distinct()
    .where('review_log.session_id', '=', sessionId)
    .execute()
  return rows.length === 1
    ? { chapter: rows[0]?.chapter ?? '', mixed: false }
    : { chapter: null, mixed: true }
}

export async function recentSessions(deps: HistoryDeps, limit?: number): Promise<RecentSession[]> {
  const { db } = deps
  const rows = await db
    .selectFrom('session')
    .innerJoin('module', 'module.id', 'session.module_id')
    .select([
      'session.id',
      'session.module_id',
      'module.name',
      'session.chapter',
      'session.mixed',
      'session.started_at',
      'session.ended_at',
      'session.seen',
      'session.correct'
    ])
    .where('session.seen', '>', 0)
    .orderBy('session.started_at', 'desc')
    .limit(clamp(limit, 3, 20))
    .execute()
  const out: RecentSession[] = []
  for (const r of rows) {
    const scope =
      r.chapter !== null || r.mixed
        ? { chapter: r.chapter, mixed: r.mixed === 1 }
        : await soleChapter(db, r.id)
    const counts = await db
      .selectFrom('card')
      .select((eb) => [
        eb.fn.countAll<number>().as('total'),
        eb.fn.count<number>('retired_at').as('retired')
      ])
      .where('module_id', '=', r.module_id)
      .where('orphaned', '=', 0)
      .$if(!scope.mixed && !!scope.chapter, (qb) => qb.where('chapter', '=', scope.chapter!))
      .$if(!scope.mixed && scope.chapter === '', (qb) => qb.where('chapter', 'is', null))
      .executeTakeFirstOrThrow()
    out.push({
      sessionId: r.id,
      moduleId: r.module_id,
      name: r.name,
      chapter: scope.mixed ? null : scope.chapter,
      mixed: scope.mixed,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      seen: r.seen,
      correct: r.correct,
      total: Number(counts.total),
      retired: Number(counts.retired)
    })
  }
  return out
}

export async function historyPage(
  deps: HistoryDeps,
  offset: number,
  limit?: number
): Promise<HistoryPage> {
  const { db, library } = deps
  const from = Math.max(0, Math.floor(Number(offset) || 0))
  const size = clamp(limit, HISTORY_PAGE, 200)
  const base = db
    .selectFrom('review_log')
    .innerJoin('card', 'card.id', 'review_log.card_id')
    .innerJoin('module', 'module.id', 'card.module_id')
    .where('review_log.kind', '!=', 'migration')
  const total = await base
    .select((eb) => eb.fn.countAll<number>().as('n'))
    .executeTakeFirstOrThrow()
  const rows = await base
    .select([
      'review_log.id',
      'review_log.ts',
      'review_log.picks',
      'review_log.wrong_picks',
      'review_log.self_assess',
      'review_log.duration_ms',
      'card.module_id',
      'card.question_id',
      'card.chapter',
      'module.name'
    ])
    .orderBy('review_log.ts', 'desc')
    .orderBy('review_log.id', 'desc')
    .limit(size)
    .offset(from)
    .execute()
  await library.refresh()
  const items: HistoryItem[] = []
  for (const r of rows) {
    let q: Question | undefined
    try {
      q = await (await library.indexFor(r.module_id)).get(r.question_id)
    } catch {
      q = undefined
    }
    const open = q?.kind === 'acik-uclu'
    const first = r.picks ? (r.picks.split(',')[0] as ChoiceKey) : null
    items.push({
      id: r.id,
      moduleId: r.module_id,
      moduleName: r.name,
      questionId: r.question_id,
      chapter: r.chapter,
      kind: q?.kind ?? null,
      stem: q ? plain(q.stem.md) : r.question_id,
      answer: first,
      correctKey: q?.correct ?? null,
      correct: open ? r.self_assess !== 1 : r.wrong_picks === 0,
      ts: r.ts,
      durationMs: r.duration_ms
    })
  }
  return { items, total: Number(total.n), offset: from }
}
