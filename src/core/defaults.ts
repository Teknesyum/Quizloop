import type { Kysely } from 'kysely'
import { forgetModule } from '@core/commands/modules'
import type { Database } from '@core/db/types'

export const RETIRED = ['quizloop-rehberi']

export function baseName(path: string): string {
  return (
    path
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? path
  )
}

export function newDefaults(
  bundled: string[],
  installed: string[],
  offered: string[],
  firstRun: boolean
): string[] {
  if (firstRun) return []
  if (!offered.length && !bundled.some((id) => installed.includes(id))) return []
  return bundled.filter((id) => !offered.includes(id) && !installed.includes(id))
}

export async function seedDefaults(
  db: Kysely<Database>,
  roots: string[],
  settings: { get(): { defaults: string[] }; set(patch: { defaults: string[] }): unknown },
  firstRun: boolean,
  install: (root: string) => Promise<unknown>
): Promise<string[]> {
  const bundled = roots.map(baseName)
  const installed = (await db.selectFrom('module').select('id').execute()).map((r) => r.id)
  const offered = settings.get().defaults
  if (!offered.length && !firstRun)
    for (const id of RETIRED) if (installed.includes(id)) await forgetModule(db, id)
  const todo = newDefaults(bundled, installed, offered, firstRun)
  for (const root of roots) if (todo.includes(baseName(root))) await install(root)
  const all = [...new Set([...offered, ...bundled])]
  if (all.length !== offered.length) await settings.set({ defaults: all })
  return todo
}
