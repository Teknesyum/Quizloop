import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface ModuleTable {
  id: string
  name: string
  version: string
  path: string
  question_count: number
  installed_at: string
  updated_at: string
}

export interface CardTable {
  id: Generated<number>
  module_id: string
  question_id: string
  concept_id: string
  content_hash: string
  core_hash: string
  state: number
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  last_review: string | null
  retired_at: string | null
  orphaned: number
  last_self_assess: number | null
}

export interface ReviewLogTable {
  id: Generated<number>
  card_id: number
  session_id: string | null
  ts: string
  kind: string
  rating: number
  self_assess: number | null
  revealed_choices: number
  known_without_choices: number
  wrong_picks: number
  duration_ms: number
  state_before: number
  due_before: string
  stability_before: number
  difficulty_before: number
  elapsed_days: number
  scheduled_days: number
}

export interface SessionTable {
  id: string
  module_id: string
  started_at: string
  ended_at: string | null
  seen: number
  correct: number
  score: number
}

export interface FlagTable {
  id: Generated<number>
  module_id: string
  question_id: string
  ts: string
  note: string | null
}

export interface Database {
  module: ModuleTable
  card: CardTable
  review_log: ReviewLogTable
  session: SessionTable
  flag: FlagTable
}

export type Card = Selectable<CardTable>
export type NewCard = Insertable<CardTable>
export type CardPatch = Updateable<CardTable>
export type NewReviewLog = Insertable<ReviewLogTable>
export type ModuleRow = Selectable<ModuleTable>
