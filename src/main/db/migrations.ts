import { Kysely, sql } from 'kysely'
import type { Migration, MigrationProvider } from 'kysely/migration'

const m0001: Migration = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('module')
      .addColumn('id', 'text', (c) => c.primaryKey())
      .addColumn('name', 'text', (c) => c.notNull())
      .addColumn('version', 'text', (c) => c.notNull())
      .addColumn('path', 'text', (c) => c.notNull())
      .addColumn('question_count', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('installed_at', 'text', (c) => c.notNull())
      .addColumn('updated_at', 'text', (c) => c.notNull())
      .execute()

    await db.schema
      .createTable('card')
      .addColumn('id', 'integer', (c) => c.primaryKey().autoIncrement())
      .addColumn('module_id', 'text', (c) =>
        c.notNull().references('module.id').onDelete('cascade')
      )
      .addColumn('question_id', 'text', (c) => c.notNull())
      .addColumn('concept_id', 'text', (c) => c.notNull())
      .addColumn('content_hash', 'text', (c) => c.notNull())
      .addColumn('core_hash', 'text', (c) => c.notNull().defaultTo(''))
      .addColumn('state', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('due', 'text', (c) => c.notNull())
      .addColumn('stability', 'real', (c) => c.notNull().defaultTo(0))
      .addColumn('difficulty', 'real', (c) => c.notNull().defaultTo(0))
      .addColumn('elapsed_days', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('scheduled_days', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('learning_steps', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('reps', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('lapses', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('last_review', 'text')
      .addColumn('retired_at', 'text')
      .addColumn('orphaned', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('last_self_assess', 'integer')
      .addUniqueConstraint('card_module_question', ['module_id', 'question_id'])
      .execute()

    await db.schema.createIndex('card_due').on('card').columns(['module_id', 'due']).execute()
    await db.schema
      .createIndex('card_concept')
      .on('card')
      .columns(['module_id', 'concept_id'])
      .execute()

    await db.schema
      .createTable('session')
      .addColumn('id', 'text', (c) => c.primaryKey())
      .addColumn('module_id', 'text', (c) => c.notNull())
      .addColumn('started_at', 'text', (c) => c.notNull())
      .addColumn('ended_at', 'text')
      .addColumn('seen', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('correct', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('score', 'integer', (c) => c.notNull().defaultTo(0))
      .execute()

    await db.schema
      .createTable('review_log')
      .addColumn('id', 'integer', (c) => c.primaryKey().autoIncrement())
      .addColumn('card_id', 'integer', (c) => c.notNull().references('card.id').onDelete('cascade'))
      .addColumn('session_id', 'text')
      .addColumn('ts', 'text', (c) => c.notNull())
      .addColumn('kind', 'text', (c) => c.notNull().defaultTo('review'))
      .addColumn('rating', 'integer', (c) => c.notNull())
      .addColumn('self_assess', 'integer')
      .addColumn('revealed_choices', 'integer', (c) => c.notNull().defaultTo(1))
      .addColumn('known_without_choices', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('wrong_picks', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('duration_ms', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('state_before', 'integer', (c) => c.notNull())
      .addColumn('due_before', 'text', (c) => c.notNull())
      .addColumn('stability_before', 'real', (c) => c.notNull())
      .addColumn('difficulty_before', 'real', (c) => c.notNull())
      .addColumn('elapsed_days', 'integer', (c) => c.notNull().defaultTo(0))
      .addColumn('scheduled_days', 'integer', (c) => c.notNull().defaultTo(0))
      .execute()

    await db.schema
      .createIndex('review_log_card')
      .on('review_log')
      .columns(['card_id', 'ts'])
      .execute()
    await db.schema.createIndex('review_log_ts').on('review_log').column('ts').execute()

    await db.schema
      .createTable('flag')
      .addColumn('id', 'integer', (c) => c.primaryKey().autoIncrement())
      .addColumn('module_id', 'text', (c) => c.notNull())
      .addColumn('question_id', 'text', (c) => c.notNull())
      .addColumn('ts', 'text', (c) => c.notNull())
      .addColumn('note', 'text')
      .execute()
  },
  async down(db: Kysely<unknown>) {
    for (const t of ['flag', 'review_log', 'session', 'card', 'module']) {
      await sql`drop table if exists ${sql.table(t)}`.execute(db)
    }
  }
}

export const migrations: Record<string, Migration> = {
  '0001_initial': m0001
}

export const provider: MigrationProvider = {
  async getMigrations() {
    return migrations
  }
}

export const LATEST = Object.keys(migrations).length
