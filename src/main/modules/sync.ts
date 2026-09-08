import type { Kysely } from 'kysely'
import type { Database } from '@main/db/types'
import { emptyCardFields, softReset } from '@main/scheduler/fsrs'
import type { Question } from '@shared/schema/question'
import { iterateQuestions, type LoadedModule } from './loader'

export interface SyncReport {
  added: number
  updated: number
  reset: number
  orphaned: number
}

function coreHash(q: Question): string {
  return JSON.stringify([q.stem, q.correct, q.choices.map((c) => [c.key, c.md])])
}

export async function syncModule(
  db: Kysely<Database>,
  mod: LoadedModule,
  now: Date
): Promise<SyncReport> {
  const report: SyncReport = { added: 0, updated: 0, reset: 0, orphaned: 0 }
  const iso = now.toISOString()
  const moduleId = mod.meta.id

  const existing = await db
    .selectFrom('card')
    .selectAll()
    .where('module_id', '=', moduleId)
    .execute()
  const byQuestion = new Map(existing.map((c) => [c.question_id, c]))
  const seen = new Set<string>()

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('module')
      .values({
        id: moduleId,
        name: mod.meta.name,
        version: mod.meta.version,
        path: mod.root,
        question_count: mod.meta.questionCount,
        installed_at: iso,
        updated_at: iso
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          name: mod.meta.name,
          version: mod.meta.version,
          path: mod.root,
          question_count: mod.meta.questionCount,
          updated_at: iso
        })
      )
      .execute()

    for (const q of iterateQuestions(mod)) {
      seen.add(q.id)
      const row = byQuestion.get(q.id)
      if (q.deleted) {
        if (row && !row.orphaned) {
          await trx.updateTable('card').set({ orphaned: 1 }).where('id', '=', row.id).execute()
          report.orphaned++
        }
        continue
      }
      if (!row) {
        await trx
          .insertInto('card')
          .values({
            module_id: moduleId,
            question_id: q.id,
            concept_id: q.conceptId,
            content_hash: q.contentHash,
            core_hash: coreHash(q),
            orphaned: 0,
            retired_at: null,
            last_self_assess: null,
            ...emptyCardFields(now)
          })
          .execute()
        report.added++
        continue
      }
      if (row.orphaned) {
        await trx.updateTable('card').set({ orphaned: 0 }).where('id', '=', row.id).execute()
      }
      if (row.content_hash === q.contentHash) continue

      const core = coreHash(q)
      const changedCore = row.core_hash !== '' && row.core_hash !== core

      if (changedCore) {
        await trx
          .insertInto('review_log')
          .values({
            card_id: row.id,
            session_id: null,
            ts: iso,
            kind: 'migration',
            rating: 0,
            self_assess: null,
            revealed_choices: 0,
            known_without_choices: 0,
            wrong_picks: 0,
            duration_ms: 0,
            state_before: row.state,
            due_before: row.due,
            stability_before: row.stability,
            difficulty_before: row.difficulty,
            elapsed_days: 0,
            scheduled_days: 0
          })
          .execute()
        await trx
          .updateTable('card')
          .set({
            ...softReset(row, now),
            content_hash: q.contentHash,
            core_hash: core,
            concept_id: q.conceptId
          })
          .where('id', '=', row.id)
          .execute()
        report.reset++
      } else {
        await trx
          .updateTable('card')
          .set({ content_hash: q.contentHash, core_hash: core, concept_id: q.conceptId })
          .where('id', '=', row.id)
          .execute()
        report.updated++
      }
    }

    for (const row of existing) {
      if (seen.has(row.question_id) || row.orphaned) continue
      await trx.updateTable('card').set({ orphaned: 1 }).where('id', '=', row.id).execute()
      report.orphaned++
    }
  })

  return report
}
