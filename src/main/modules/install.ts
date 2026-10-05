import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import {
  checkFolder,
  installFailure,
  resyncFolders,
  syncFolder,
  mayInstall,
  type AskChange
} from '@core/commands/modules'
import { copyTree, removeTree, skipBuild } from '@main/fstree'
import { nodePorts } from '@main/ports'
import { modulesDir } from '@main/settings'
import { Work } from '@main/work'
import type { InstallResult } from '@shared/ipc'
import { isPackage, unpack, type Unpacked } from './paket'

export function samplePaths(): string[] {
  const root = join(__dirname, '../../resources/ornek').replace('app.asar', 'app.asar.unpacked')
  if (!existsSync(root)) return []
  return readdirSync(root)
    .sort()
    .map((id) => join(root, id))
    .filter((dir) => existsSync(join(dir, 'module.json')))
}

export async function installSamples(db: Kysely<Database>, now: Date): Promise<InstallResult> {
  let last: InstallResult = { ok: false }
  for (const dir of samplePaths()) last = await installFrom(db, dir, now)
  return last
}

export async function installFrom(
  db: Kysely<Database>,
  source: string,
  now: Date,
  work: Work = new Work('install'),
  ask?: AskChange
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
    const { meta } = await checkFolder(nodePorts, source)
    if (ask && !(await mayInstall(db, meta, ask))) {
      work.finish(true)
      return { ok: false, cancelled: true }
    }
    const target = resolve(join(modulesDir(), meta.id))
    if (resolve(source) !== target) {
      if (existsSync(target)) await removeTree(target, () => undefined)
      await copyTree(source, target, work.span('copy', 60, 85), skipBuild)
    }
    work.at('sync', 85, 100)
    const r = await syncFolder(db, nodePorts, target, now)
    work.finish(true)
    return r
  } catch (e) {
    work.finish(false)
    return installFailure(e)
  } finally {
    paket?.cleanup()
  }
}

export async function resyncAll(db: Kysely<Database>, now: Date): Promise<void> {
  await resyncFolders(
    db,
    nodePorts,
    async (r) => {
      const root = existsSync(join(r.path, 'module.json')) ? r.path : join(modulesDir(), r.id)
      return existsSync(join(root, 'module.json')) ? resolve(root) : null
    },
    now
  )
}

export async function removeModuleTree(
  path: string | null,
  work: Work = new Work('remove')
): Promise<void> {
  if (path && path.startsWith(modulesDir())) await removeTree(path, work.span('remove', 0, 100))
  work.finish(true)
}
