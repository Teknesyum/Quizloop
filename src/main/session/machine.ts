import { randomUUID } from 'node:crypto'
import type { Kysely } from 'kysely'
import type { Card, Database } from '@main/db/types'
import type { QuestionIndex } from '@main/modules/loader'
import { mapRating, schedule } from '@main/scheduler/fsrs'
import { buildQueue } from '@main/scheduler/queue'
import type {
  AnswerResult,
  GradeResult,
  QuestionView,
  SelfAssess,
  SessionSummary
} from '@shared/ipc'
import type { ChoiceKey, Question } from '@shared/schema/question'

export type Phase = 'stem' | 'choices' | 'solved'

interface Current {
  card: Card
  question: Question
  phase: Phase
  knownWithoutChoices: boolean
  wrongPicks: number
  relearn: boolean
}

interface Live {
  id: string
  moduleId: string
  index: QuestionIndex
  queue: Card[]
  relearn: Card[]
  pos: number
  current: Current | null
  seen: number
  correctFirstTry: number
  score: number
  retired: number
  relearned: number
  startedAt: Date
}

export interface MachineDeps {
  db: Kysely<Database>
  indexFor(moduleId: string): QuestionIndex
  assetBase(moduleId: string): string
  dayStart(now: Date): Date
  limit(): number
  now?: () => Date
}

export class SessionError extends Error {}

const SCORE_FIRST_TRY = 10
const SCORE_KNOWN_BONUS = 5
const SCORE_WRONG_PENALTY = 3

export class SessionMachine {
  private live = new Map<string, Live>()
  private readonly clock: () => Date

  constructor(private readonly deps: MachineDeps) {
    this.clock = deps.now ?? (() => new Date())
  }

  private get(id: string): Live {
    const s = this.live.get(id)
    if (!s) throw new SessionError('session not found')
    return s
  }

  private view(s: Live, c: Current): QuestionView {
    const q = c.question
    return {
      questionId: q.id,
      index: s.seen + 1,
      total: s.queue.length + s.relearn.length,
      stem: q.stem,
      choices: q.choices,
      difficulty: q.difficulty,
      tags: q.tags,
      assetBase: this.deps.assetBase(s.moduleId),
      relearn: c.relearn
    }
  }

  private advance(s: Live): QuestionView | null {
    while (true) {
      let card: Card | undefined
      let relearn = false
      if (s.pos < s.queue.length) {
        card = s.queue[s.pos++]
      } else if (s.relearn.length) {
        card = s.relearn.shift()
        relearn = true
      }
      if (!card) {
        s.current = null
        return null
      }
      const question = s.index.get(card.question_id)
      if (!question || question.deleted) continue
      s.current = {
        card,
        question,
        phase: 'stem',
        knownWithoutChoices: false,
        wrongPicks: 0,
        relearn
      }
      return this.view(s, s.current)
    }
  }

  async start(
    moduleId: string
  ): Promise<{ sessionId: string; first: QuestionView | null; total: number }> {
    const now = this.clock()
    const queue = await buildQueue(this.deps.db, {
      moduleId,
      now,
      dayStart: this.deps.dayStart(now),
      limit: this.deps.limit()
    })
    const id = randomUUID()
    const s: Live = {
      id,
      moduleId,
      index: this.deps.indexFor(moduleId),
      queue,
      relearn: [],
      pos: 0,
      current: null,
      seen: 0,
      correctFirstTry: 0,
      score: 0,
      retired: 0,
      relearned: 0,
      startedAt: now
    }
    this.live.set(id, s)
    await this.deps.db
      .insertInto('session')
      .values({
        id,
        module_id: moduleId,
        started_at: now.toISOString(),
        ended_at: null,
        seen: 0,
        correct: 0,
        score: 0
      })
      .execute()
    return { sessionId: id, first: this.advance(s), total: queue.length }
  }

  known(id: string): void {
    const c = this.get(id).current
    if (c && c.phase === 'stem') c.knownWithoutChoices = true
  }

  reveal(id: string): void {
    const c = this.get(id).current
    if (c && c.phase === 'stem') c.phase = 'choices'
  }

  answer(id: string, key: ChoiceKey): AnswerResult {
    const c = this.get(id).current
    if (!c) throw new SessionError('no current question')
    if (c.phase === 'solved') throw new SessionError('already solved')
    if (c.phase === 'stem') c.phase = 'choices'
    const q = c.question
    if (!q.choices.some((ch) => ch.key === key)) throw new SessionError('unknown choice')
    if (key === q.correct) {
      c.phase = 'solved'
      return {
        correct: true,
        key,
        correctKey: q.correct,
        solution: q.solution,
        source: q.source,
        wrongPicks: c.wrongPicks
      }
    }
    c.wrongPicks++
    c.knownWithoutChoices = false
    return { correct: false, key, explanation: q.distractors[key], wrongPicks: c.wrongPicks }
  }

  async grade(id: string, self: SelfAssess, durationMs: number): Promise<GradeResult> {
    const s = this.get(id)
    const c = s.current
    if (!c) throw new SessionError('no current question')
    if (c.phase !== 'solved') throw new SessionError('not solved yet')
    const now = this.clock()
    const rating = mapRating(self, {
      knownWithoutChoices: c.knownWithoutChoices,
      wrongPicks: c.wrongPicks
    })
    const { patch, log } = schedule(c.card, rating, now)
    const retired = self === 3
    const row = c.card

    let delta: number
    if (c.wrongPicks === 0) {
      delta = SCORE_FIRST_TRY + (c.knownWithoutChoices ? SCORE_KNOWN_BONUS : 0)
      if (!c.relearn) s.correctFirstTry++
    } else {
      delta = Math.max(0, SCORE_FIRST_TRY - SCORE_WRONG_PENALTY * c.wrongPicks)
    }

    await this.deps.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('card')
        .set({ ...patch, last_self_assess: self, retired_at: retired ? now.toISOString() : null })
        .where('id', '=', row.id)
        .execute()
      await trx
        .insertInto('review_log')
        .values({
          card_id: row.id,
          session_id: s.id,
          ts: now.toISOString(),
          kind: c.relearn ? 'relearn' : 'review',
          rating,
          self_assess: self,
          revealed_choices: 1,
          known_without_choices: c.knownWithoutChoices ? 1 : 0,
          wrong_picks: c.wrongPicks,
          duration_ms: Math.max(0, Math.round(durationMs)),
          state_before: row.state,
          due_before: row.due,
          stability_before: row.stability,
          difficulty_before: row.difficulty,
          elapsed_days: log.elapsed_days,
          scheduled_days: log.scheduled_days
        })
        .execute()
    })

    if (!c.relearn) s.seen++
    s.score += delta
    if (retired) s.retired++
    if (c.relearn && self !== 1) s.relearned++
    if (self === 1) {
      const fresh = await this.deps.db
        .selectFrom('card')
        .selectAll()
        .where('id', '=', row.id)
        .executeTakeFirst()
      if (fresh) s.relearn.push(fresh)
    }

    await this.deps.db
      .updateTable('session')
      .set({ seen: s.seen, correct: s.correctFirstTry, score: s.score })
      .where('id', '=', s.id)
      .execute()

    return { rating, dueAt: String(patch.due), retired, scoreDelta: delta, next: this.advance(s) }
  }

  async flag(id: string, note?: string): Promise<void> {
    const s = this.get(id)
    const c = s.current
    if (!c) return
    await this.deps.db
      .insertInto('flag')
      .values({
        module_id: s.moduleId,
        question_id: c.question.id,
        ts: this.clock().toISOString(),
        note: note ?? null
      })
      .execute()
  }

  async end(id: string): Promise<SessionSummary> {
    const s = this.get(id)
    const now = this.clock()
    await this.deps.db
      .updateTable('session')
      .set({
        ended_at: now.toISOString(),
        seen: s.seen,
        correct: s.correctFirstTry,
        score: s.score
      })
      .where('id', '=', s.id)
      .execute()
    this.live.delete(id)
    return {
      sessionId: s.id,
      moduleId: s.moduleId,
      seen: s.seen,
      correctFirstTry: s.correctFirstTry,
      score: s.score,
      retired: s.retired,
      relearned: s.relearned,
      startedAt: s.startedAt.toISOString(),
      endedAt: now.toISOString()
    }
  }

  pending(id: string): { queued: number; relearn: number } {
    const s = this.get(id)
    return { queued: s.queue.length - s.pos, relearn: s.relearn.length }
  }
}
