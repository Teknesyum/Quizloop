import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import type { Kysely } from 'kysely'
import {
  checkFolder,
  installFailure,
  syncFolder,
  versionChange,
  type AskChange
} from '@core/commands/modules'
import type { Database } from '@core/db/types'
import type { CorePorts } from '@core/ports'
import type { InstallResult } from '@shared/ipc'
import { Work, type ProgressSink } from './work'

interface Picked {
  cancelled: boolean
  uri?: string
  name?: string
  size?: number
}

interface Unpacked {
  tmp: string
  root: string | null
  size: number
  free: number
  written: number
  files: number
  ms: number
}

interface PaketPlugin {
  root(): Promise<{ path: string }>
  pick(): Promise<Picked>
  unpack(o: { uri: string }): Promise<Unpacked>
  commit(o: { tmp: string; root: string; id: string }): Promise<{ path: string; ms: number }>
  discard(o: { tmp: string }): Promise<void>
  sweep(): Promise<{ removed: number }>
  exists(o: { path: string }): Promise<{ exists: boolean }>
  remove(o: { path: string }): Promise<void>
  addListener(
    event: 'progress',
    cb: (p: { done: number; total: number }) => void
  ): Promise<PluginListenerHandle>
}

const Paket = registerPlugin<PaketPlugin>('QuizloopPaket')
const MB = 1048576

export interface ModuleStore {
  ports: CorePorts
  url(root: string): string
  locate(row: { id: string; path: string }): Promise<string | null>
  remove(path: string | null): Promise<void>
  install(db: Kysely<Database>, sink: ProgressSink, ask: AskChange): Promise<InstallResult | null>
}

function log(event: string, data: Record<string, unknown>): void {
  console.info(`[quizloop] ${event} ${JSON.stringify(data)}`)
}

export async function openStore(bundled: CorePorts, bundleRoot: string): Promise<ModuleStore> {
  const { path: base } = await Paket.root()
  const sweep = await Paket.sweep().catch(() => ({ removed: 0 }))
  if (sweep.removed) log('sweep', sweep)
  const owns = (p: string): boolean => p === base || p.startsWith(`${base}/`)
  const isBundled = (p: string): boolean => p.startsWith(`${bundleRoot}/`)

  const ports: CorePorts = {
    readText: async (path) => {
      if (isBundled(path)) return bundled.readText(path)
      const r = await fetch(Capacitor.convertFileSrc(path))
      if (!r.ok) throw new Error(`read failed: ${path}`)
      return r.text()
    },
    exists: async (path) => {
      if (isBundled(path)) return bundled.exists(path)
      return (await Paket.exists({ path })).exists
    },
    sha256: bundled.sha256,
    now: bundled.now
  }

  const install = async (
    db: Kysely<Database>,
    sink: ProgressSink,
    ask: AskChange
  ): Promise<InstallResult | null> => {
    const picked = await Paket.pick()
    if (picked.cancelled || !picked.uri) return null
    const work = new Work('install', sink)
    const t0 = performance.now()
    work.at('read', 0, 1)
    let tmp: string | null = null
    try {
      const handle = await Paket.addListener('progress', ({ done, total }) =>
        work.at('extract', 1, 75, Math.round(done / MB), Math.round(total / MB))
      )
      let u: Unpacked
      try {
        u = await Paket.unpack({ uri: picked.uri })
      } finally {
        await handle.remove()
      }
      tmp = u.tmp
      if (!u.root) throw new Error('module.json missing in package')
      work.at('verify', 75, 88)
      const tVerify = performance.now()
      const { meta } = await checkFolder(ports, u.root)
      const verifyMs = performance.now() - tVerify
      const change = await versionChange(db, meta)
      if (change && !(await ask(change))) {
        work.finish(true)
        return { ok: false, cancelled: true }
      }
      const moved = await Paket.commit({ tmp: u.tmp, root: u.root, id: meta.id })
      tmp = null
      work.at('sync', 88, 100)
      const tSync = performance.now()
      const r = await syncFolder(db, ports, moved.path, ports.now())
      const syncMs = performance.now() - tSync
      log('paket', {
        id: meta.id,
        name: picked.name,
        sizeMb: Math.round(u.size / MB),
        writtenMb: Math.round(u.written / MB),
        freeMb: Math.round(u.free / MB),
        files: u.files,
        unpackMs: u.ms,
        verifyMs: Math.round(verifyMs),
        commitMs: moved.ms,
        syncMs: Math.round(syncMs),
        totalMs: Math.round(performance.now() - t0)
      })
      work.finish(true)
      return r
    } catch (e) {
      log('paketFailed', { error: String(e) })
      work.finish(false)
      return installFailure(e)
    } finally {
      if (tmp) await Paket.discard({ tmp }).catch(() => undefined)
    }
  }

  return {
    ports,
    url: (root) => (isBundled(root) ? root : Capacitor.convertFileSrc(root)),
    locate: async (row) => {
      const root = owns(row.path) ? row.path : `${base}/${row.id}`
      return (await ports.exists(`${root}/module.json`)) ? root : null
    },
    remove: async (path) => {
      if (path && owns(path) && path !== base) await Paket.remove({ path })
    },
    install
  }
}
