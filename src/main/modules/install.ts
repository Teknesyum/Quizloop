import { app } from 'electron'
import { cpSync, existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import type { Database } from '@main/db/types'
import { modulesDir } from '@main/settings'
import type { InstallResult } from '@shared/ipc'
import { ModuleError, readMeta, validateModule } from './loader'
import { syncModule } from './sync'

export function samplePath(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'ornek')
  return resolve(app.getAppPath(), 'modules', '_ornek')
}

export async function installFrom(
  db: Kysely<Database>,
  source: string,
  now: Date
): Promise<InstallResult> {
  try {
    const { meta } = validateModule(source)
    const target = join(modulesDir(), meta.id)
    if (resolve(source) !== resolve(target)) {
      if (existsSync(target)) rmSync(target, { recursive: true, force: true })
      cpSync(source, target, { recursive: true, filter: (p) => !/[\\/]build([\\/]|$)/.test(p) })
    }
    const mod = readMeta(target)
    const r = await syncModule(db, mod, now)
    return {
      ok: true,
      moduleId: meta.id,
      updated: r.updated + r.added,
      reset: r.reset,
      orphaned: r.orphaned
    }
  } catch (e) {
    const msg = e instanceof ModuleError ? [e.message, ...e.issues].join('\n') : String(e)
    return { ok: false, error: msg }
  }
}

export async function resyncAll(db: Kysely<Database>, now: Date): Promise<void> {
  const rows = await db.selectFrom('module').select(['id', 'path']).execute()
  for (const r of rows) {
    if (!existsSync(join(r.path, 'module.json'))) continue
    try {
      await syncModule(db, readMeta(r.path), now)
    } catch {
      continue
    }
  }
}

export async function removeModule(db: Kysely<Database>, moduleId: string): Promise<void> {
  const row = await db
    .selectFrom('module')
    .select('path')
    .where('id', '=', moduleId)
    .executeTakeFirst()
  await db.deleteFrom('module').where('id', '=', moduleId).execute()
  if (row && row.path.startsWith(modulesDir())) rmSync(row.path, { recursive: true, force: true })
}
