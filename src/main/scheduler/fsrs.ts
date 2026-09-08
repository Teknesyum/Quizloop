import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade
} from 'ts-fsrs'
import type { FsrsRating, SelfAssess } from '@shared/ipc'
import type { Card, CardPatch, NewCard } from '@main/db/types'

const engine = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true }))

export interface ObjectiveSignal {
  knownWithoutChoices: boolean
  wrongPicks: number
}

export function mapRating(self: SelfAssess, obj: ObjectiveSignal): FsrsRating {
  if (self === 1) return Rating.Again
  const firstTry = obj.wrongPicks === 0
  if (self === 2) return firstTry ? Rating.Hard : Rating.Again
  if (!firstTry) return Rating.Hard
  return obj.knownWithoutChoices ? Rating.Easy : Rating.Good
}

export function emptyCardFields(
  now: Date
): Pick<
  NewCard,
  | 'state'
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsed_days'
  | 'scheduled_days'
  | 'learning_steps'
  | 'reps'
  | 'lapses'
  | 'last_review'
> {
  const c = createEmptyCard(now)
  return {
    state: c.state,
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    last_review: null
  }
}

export function toFsrs(row: Card): FsrsCard {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined
  }
}

export function fromFsrs(c: FsrsCard): CardPatch {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.toISOString() : null
  }
}

export interface ScheduleResult {
  patch: CardPatch
  log: { elapsed_days: number; scheduled_days: number }
}

export function schedule(row: Card, rating: FsrsRating, now: Date): ScheduleResult {
  const { card, log } = engine.next(toFsrs(row), now, rating as Grade)
  return {
    patch: fromFsrs(card),
    log: { elapsed_days: log.elapsed_days, scheduled_days: log.scheduled_days }
  }
}

export function softReset(row: Card, now: Date): CardPatch {
  return {
    stability: row.stability / 2,
    due: now.toISOString(),
    state: row.state === State.New ? State.New : State.Review
  }
}

export { Rating, State }
