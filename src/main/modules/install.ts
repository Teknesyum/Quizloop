import { app } from 'electron'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import type { Database } from '@main/db/types'
import { copyTree, removeTree, skipBuild } from '@main/fstree'
import { modulesDir } from '@main/settings'
import { Work } from '@main/work'
import type { InstallResult } from '@shared/ipc'
import { ModuleError, readMeta, validateModule } from './loader'
import { isPackage, unpack, type Unpacked } from './paket'
import { syncModule } from './sync'

export function samplePath(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'ornek')
  return resolve(app.getAppPath(), 'modules', '_ornek')
}

export async function installFrom(
  db: Kysely<Database>,
  source: string,
  now: Date,
  work: Work = new Work('install')
): Promise<InstallResult> {
  let paket: Unpacked | null = null
  try {
    if (isPackage(source)) {
      work.at('read', 0, 10)
      paket = await unpack(source, undefined, {
        read: () => work.at('unpack', 10, 35),
        write: (d, t) => work.at('write', 35, 60, d, t)
      })
      source = paket.root
    }
    const { meta } = validateModule(source)
    const target = join(modulesDir(), meta.id)
    if (resolve(source) !== resolve(target)) {
      if (existsSync(target)) await removeTree(target, () => undefined)
      await copyTree(source, target, work.span('copy', 60, 85), skipBuild)
    }
    work.at('sync', 85, 100)
    const mod = readMeta(target)
    const r = await syncModule(db, mod, now)
    work.finish(true)
    return {
      ok: true,
      moduleId: meta.id,
      name: meta.name,
      questionCount: meta.questionCount,
      updated: r.updated + r.added,
      reset: r.reset,
      orphaned: r.orphaned
    }
  } catch (e) {
    work.finish(false)
    const msg = e instanceof ModuleError ? [e.message, ...e.issues].join('\n') : String(e)
    return { ok: false, error: msg }
  } finally {
    paket?.cleanup()
  }
}

export async function resyncAll(db: Kysely<Database>, now: Date): Promise<void> {
  const rows = await db.selectFrom('module').select(['id', 'path']).execute()
  for (const r of rows) {
    const root = existsSync(join(r.path, 'module.json')) ? r.path : join(modulesDir(), r.id)
    if (!existsSync(join(root, 'module.json'))) continue
    try {
      await syncModule(db, readMeta(root), now)
    } catch {
      continue
    }
  }
}

export async function resetModule(db: Kysely<Database>, moduleId: string): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const ids = (
      await trx.selectFrom('card').select('id').where('module_id', '=', moduleId).execute()
    ).map((r) => r.id)
    if (ids.length) await trx.deleteFrom('review_log').where('card_id', 'in', ids).execute()
    await trx.deleteFrom('flag').where('module_id', '=', moduleId).execute()
    await trx.deleteFrom('session').where('module_id', '=', moduleId).execute()
    await trx
      .updateTable('card')
      .set({
        state: 0,
        due: new Date(0).toISOString(),
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        last_review: null,
        retired_at: null,
        last_self_assess: null
      })
      .where('module_id', '=', moduleId)
      .execute()
  })
}

export async function removeModule(
  db: Kysely<Database>,
  moduleId: string,
  work: Work = new Work('remove')
): Promise<void> {
  const row = await db
    .selectFrom('module')
    .select('path')
    .where('id', '=', moduleId)
    .executeTakeFirst()
  await db.deleteFrom('module').where('id', '=', moduleId).execute()
  if (row && row.path.startsWith(modulesDir()))
    await removeTree(row.path, work.span('remove', 0, 100))
  work.finish(true)
}
