import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { fingerprint, ModuleError, readMeta, validateModule, type Tick } from '@core/modules/loader'
import { syncModule } from '@core/modules/sync'
import { joinPath, type CorePorts } from '@core/ports'
import { dailyGoal } from '@core/settings'
import { chapterCounts, countDue } from '@core/scheduler/queue'
import { newer } from '@core/version'
import { goalKey } from '@shared/ipc'
import type {
  ChapterSummary,
  GoalSetting,
  ModuleGoal,
  InstallResult,
  ModuleSummary,
  VersionChange
} from '@shared/ipc'
import { ModuleMeta } from '@shared/schema/module'
import type { Library } from './library'

export interface ModuleDeps {
  db: Kysely<Database>
  ports: CorePorts
  library: Library
  assetBase(moduleId: string): string
  dayStart(now: Date): Date
  goals(): Record<string, GoalSetting>
}

async function tagsOf(ports: CorePorts, root: string): Promise<string[]> {
  try {
    const raw = JSON.parse(await ports.readText(joinPath(root, 'module.json'))) as {
      tags?: unknown
    }
    const r = ModuleMeta.shape.tags.safeParse(raw.tags)
    return r.success ? r.data : []
  } catch {
    return []
  }
}

function goalOf(
  goal: GoalSetting | undefined,
  c: { unseen: number; dueToday: number; learning: number; retiredToday: number },
  start: Date
): ModuleGoal | null {
  const open = c.unseen + c.dueToday + c.learning
  return goal && new Date(goal.until) > start && open + c.retiredToday
    ? dailyGoal(goal, open, c.retiredToday, start)
    : null
}

export async function listModules(deps: ModuleDeps): Promise<ModuleSummary[]> {
  const { db, ports } = deps
  await deps.library.refresh()
  const rows = await db.selectFrom('module').selectAll().orderBy('name').execute()
  const now = ports.now()
  const start = deps.dayStart(now)
  const goals = deps.goals()
  const out: ModuleSummary[] = []
  for (const r of rows) {
    const c = await countDue(db, r.id, now, start)
    const goal = goals[r.id]
    out.push({
      id: r.id,
      name: r.name,
      version: r.version,
      path: r.path,
      assetBase: deps.assetBase(r.id),
      tags: await tagsOf(ports, r.path),
      questionCount: r.question_count,
      ...c,
      goal: goalOf(goal, c, start)
    })
  }
  return out
}

export async function moduleChapters(
  deps: ModuleDeps,
  moduleId: string
): Promise<ChapterSummary[]> {
  await deps.library.refresh()
  const now = deps.ports.now()
  const start = deps.dayStart(now)
  const goals = deps.goals()
  const rows = await chapterCounts(deps.db, moduleId, now, start)
  return rows.map((r) => ({
    chapter: r.chapter,
    assetBase: deps.assetBase(moduleId),
    total: r.total,
    ...r.count,
    goal: goalOf(goals[goalKey(moduleId, r.chapter)], r.count, start)
  }))
}

export function checkFolder(
  ports: CorePorts,
  root: string,
  tick?: Tick
): Promise<{ meta: ModuleMeta; count: number }> {
  return validateModule(ports, root, tick)
}

export async function syncFolder(
  db: Kysely<Database>,
  ports: CorePorts,
  root: string,
  now: Date,
  tick?: Tick
): Promise<InstallResult> {
  const mod = await readMeta(ports, root)
  const r = await syncModule(db, ports, mod, now, tick)
  return {
    ok: true,
    moduleId: mod.meta.id,
    name: mod.meta.name,
    questionCount: mod.meta.questionCount,
    updated: r.updated + r.added,
    reset: r.reset,
    orphaned: r.orphaned
  }
}

export async function versionChange(
  db: Kysely<Database>,
  meta: Pick<ModuleMeta, 'id' | 'name' | 'version'>
): Promise<VersionChange | null> {
  const row = await db
    .selectFrom('module')
    .select(['version'])
    .where('id', '=', meta.id)
    .executeTakeFirst()
  if (!row || row.version === meta.version) return null
  return {
    moduleId: meta.id,
    name: meta.name,
    from: row.version,
    to: meta.version,
    newer: newer(meta.version, row.version)
  }
}

export type AskChange = (change: VersionChange) => Promise<boolean>

export async function mayInstall(
  db: Kysely<Database>,
  meta: Pick<ModuleMeta, 'id' | 'name' | 'version'>,
  ask: AskChange
): Promise<boolean> {
  const change = await versionChange(db, meta)
  return !change || change.newer || ask(change)
}

export function installFailure(e: unknown): InstallResult {
  const msg = e instanceof ModuleError ? [e.message, ...e.issues].join('\n') : String(e)
  return { ok: false, error: msg }
}

export async function resyncFolders(
  db: Kysely<Database>,
  ports: CorePorts,
  locate: (row: { id: string; path: string }) => Promise<string | null>,
  now: Date
): Promise<void> {
  const rows = await db.selectFrom('module').select(['id', 'path', 'fingerprint']).execute()
  for (const r of rows) {
    const root = await locate(r)
    if (!root) continue
    try {
      const mod = await readMeta(ports, root)
      if (r.fingerprint && r.fingerprint === (await fingerprint(ports, mod))) continue
      await syncModule(db, ports, mod, now)
    } catch {
      continue
    }
  }
}

export async function forgetModule(db: Kysely<Database>, moduleId: string): Promise<string | null> {
  const row = await db
    .selectFrom('module')
    .select('path')
    .where('id', '=', moduleId)
    .executeTakeFirst()
  await db.deleteFrom('module').where('id', '=', moduleId).execute()
  return row?.path ?? null
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
