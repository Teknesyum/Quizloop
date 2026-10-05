import { Unzip, UnzipInflate } from 'fflate'
import type { Kysely } from 'kysely'
import {
  checkFolder,
  installFailure,
  syncFolder,
  mayInstall,
  type AskChange
} from '@core/commands/modules'
import type { Database } from '@core/db/types'
import type { CorePorts } from '@core/ports'
import type { InstallResult } from '@shared/ipc'
import { Work, type ProgressSink } from '../android/work'

const PREFIX = 'ql-mod-'
const MB = 1048576
const CANCEL_GRACE_MS = 800

export interface WebStore {
  ports: CorePorts
  locate(row: { id: string; path: string }): Promise<string | null>
  remove(path: string | null): Promise<void>
  sweep(db: Kysely<Database>): Promise<number>
  pick(): Promise<File | null>
  install(
    file: File,
    db: Kysely<Database>,
    sink: ProgressSink,
    ask: AskChange
  ): Promise<InstallResult>
}

const key = (path: string): string => path.split('/').map(encodeURIComponent).join('/')

function safe(name: string): boolean {
  if (name.startsWith('/') || name.includes('\\')) return false
  return !name.split('/').some((part) => part === '..')
}

function rootOf(names: string[]): string | null {
  if (names.includes('module.json')) return ''
  const nested = names.filter((n) => /^[^/]+\/module\.json$/.test(n))
  return nested.length === 1 ? nested[0]!.slice(0, -'/module.json'.length) : null
}

async function unpack(
  file: File,
  cache: Cache,
  base: string,
  tick: (done: number) => void
): Promise<string[]> {
  const names: string[] = []
  const writes: Promise<void>[] = []
  let failure: unknown = null
  const unzip = new Unzip()
  unzip.register(UnzipInflate)
  unzip.onfile = (entry) => {
    if (entry.name.endsWith('/')) return
    if (!safe(entry.name)) {
      failure = new Error(`paket dışına yazan yol: ${entry.name}`)
      return
    }
    const parts: BlobPart[] = []
    entry.ondata = (err, chunk, final) => {
      if (err) {
        failure = err
        return
      }
      parts.push(chunk.slice())
      if (!final) return
      names.push(entry.name)
      writes.push(cache.put(key(`${base}/${entry.name}`), new Response(new Blob(parts))))
    }
    entry.start()
  }
  const reader = file.stream().getReader()
  let done = 0
  for (;;) {
    const { value, done: end } = await reader.read()
    if (end) break
    unzip.push(value, false)
    if (failure) throw failure
    await Promise.all(writes.splice(0))
    done += value.length
    tick(done)
  }
  unzip.push(new Uint8Array(0), true)
  if (failure) throw failure
  await Promise.all(writes.splice(0))
  return names
}

export function openStore(bundled: CorePorts, bundleRoot: string): WebStore {
  const base = new URL('m', document.baseURI).pathname
  const owns = (p: string): boolean => p.startsWith(`${base}/`)
  const isBundled = (p: string): boolean => p.startsWith(`${bundleRoot}/`)
  const cacheOf = (p: string): string => PREFIX + (p.slice(base.length + 1).split('/')[0] ?? '')

  const find = async (path: string): Promise<Response | undefined> => {
    if (!owns(path) || !(await caches.has(cacheOf(path)))) return undefined
    return (await caches.open(cacheOf(path))).match(key(path))
  }

  const ports: CorePorts = {
    readText: async (path) => {
      if (isBundled(path)) return bundled.readText(path)
      const r = await find(path)
      if (!r) throw new Error(`read failed: ${path}`)
      return r.text()
    },
    exists: async (path) => {
      if (isBundled(path)) return bundled.exists(path)
      return (await find(path)) !== undefined
    },
    sha256: bundled.sha256,
    now: bundled.now
  }

  const input = document.createElement('input')
  input.type = 'file'
  input.hidden = true
  input.dataset.qlPick = 'module'
  document.body.append(input)

  const pick = (): Promise<File | null> =>
    new Promise((answer) => {
      let settled = false
      const finish = (f: File | null): void => {
        if (settled) return
        settled = true
        input.removeEventListener('change', onChange)
        input.removeEventListener('cancel', onCancel)
        window.removeEventListener('focus', onFocus)
        input.value = ''
        answer(f)
      }
      const onChange = (): void => finish(input.files?.[0] ?? null)
      const onCancel = (): void => finish(null)
      const onFocus = (): void => {
        setTimeout(() => {
          if (!input.files?.length) finish(null)
        }, CANCEL_GRACE_MS)
      }
      input.addEventListener('change', onChange)
      input.addEventListener('cancel', onCancel)
      window.addEventListener('focus', onFocus)
      input.click()
    })

  const install = async (
    file: File,
    db: Kysely<Database>,
    sink: ProgressSink,
    ask: AskChange
  ): Promise<InstallResult> => {
    const work = new Work('install', sink)
    const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    const name = PREFIX + stamp
    let keep = false
    work.at('read', 0, 1)
    try {
      const cache = await caches.open(name)
      const total = Math.max(1, Math.round(file.size / MB))
      const names = await unpack(file, cache, `${base}/${stamp}`, (done) =>
        work.at('extract', 1, 75, Math.min(total, Math.round(done / MB)), total)
      )
      const inner = rootOf(names)
      if (inner === null) throw new Error('pakette module.json yok')
      const root = inner ? `${base}/${stamp}/${inner}` : `${base}/${stamp}`
      work.at('verify', 75, 88)
      const { meta } = await checkFolder(ports, root)
      if (!(await mayInstall(db, meta, ask))) {
        work.finish(true)
        return { ok: false, cancelled: true }
      }
      const old = await db
        .selectFrom('module')
        .select(['path'])
        .where('id', '=', meta.id)
        .executeTakeFirst()
      work.at('sync', 88, 100)
      const r = await syncFolder(db, ports, root, ports.now())
      keep = true
      if (old && owns(old.path)) await caches.delete(cacheOf(old.path))
      work.finish(true)
      return r
    } catch (e) {
      console.error('[quizloop] install failed', e)
      work.finish(false)
      return installFailure(e)
    } finally {
      if (!keep) await caches.delete(name).catch(() => false)
    }
  }

  return {
    ports,
    locate: async (row) =>
      owns(row.path) && (await ports.exists(`${row.path}/module.json`)) ? row.path : null,
    remove: async (path) => {
      if (path && owns(path)) await caches.delete(cacheOf(path))
    },
    sweep: async (db) => {
      const rows = await db.selectFrom('module').select(['path']).execute()
      const live = new Set(rows.filter((r) => owns(r.path)).map((r) => cacheOf(r.path)))
      const dead = (await caches.keys()).filter((k) => k.startsWith(PREFIX) && !live.has(k))
      for (const k of dead) await caches.delete(k)
      return dead.length
    },
    pick,
    install
  }
}
