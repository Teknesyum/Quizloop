import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { newer } from '@core/version'
import type {
  InstallResult,
  CatalogRead,
  CatalogRefresh,
  CatalogSetting,
  CatalogView
} from '@shared/ipc'
import { CatalogFile, type CatalogChannel } from '@shared/schema/catalog'
import { packageAddress, catalogAddress, type CatalogFault } from '@shared/catalog'

export interface CatalogPackage {
  id: string
  url: string
  sha256: string
  size: number
}

export interface CatalogNet {
  text(url: string): Promise<string>
  install(pkg: CatalogPackage): Promise<InstallResult>
}

type Opened = { ok: true; url: string; file: CatalogFile } | { ok: false; fault: CatalogFault }

async function open(net: CatalogNet, input: string): Promise<Opened> {
  const url = catalogAddress(input)
  if (!url) return { ok: false, fault: 'address' }
  let text: string
  try {
    text = await net.text(url)
  } catch {
    return { ok: false, fault: 'network' }
  }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, fault: 'format' }
  }
  const parsed = CatalogFile.safeParse(raw)
  if (!parsed.success) return { ok: false, fault: 'format' }
  const ids = new Set(parsed.data.channels.map((c) => c.id))
  if (ids.size !== parsed.data.channels.length) return { ok: false, fault: 'format' }
  if (parsed.data.channels.some((c) => !packageAddress(url, c.package)))
    return { ok: false, fault: 'format' }
  return { ok: true, url, file: parsed.data }
}

function packageOf(catalog: string, c: CatalogChannel): CatalogPackage {
  return { id: c.id, url: packageAddress(catalog, c.package) ?? '', sha256: c.sha256, size: c.size }
}

function view(url: string, file: CatalogFile): CatalogView {
  return {
    url,
    name: file.name,
    publisher: file.publisher,
    contact: file.contact ?? null,
    channels: file.channels.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      version: c.version,
      size: c.size,
      questionCount: c.questionCount ?? null
    }))
  }
}

async function installed(db: Kysely<Database>, id: string): Promise<string | null> {
  const row = await db
    .selectFrom('module')
    .select(['version'])
    .where('id', '=', id)
    .executeTakeFirst()
  return row?.version ?? null
}

export async function readCatalog(net: CatalogNet, input: string): Promise<CatalogRead> {
  const o = await open(net, input)
  return o.ok ? { ok: true, catalog: view(o.url, o.file) } : { ok: false, fault: o.fault }
}

export async function installChannel(
  db: Kysely<Database>,
  net: CatalogNet,
  input: string,
  channelId: string
): Promise<InstallResult> {
  const o = await open(net, input)
  if (!o.ok) return { ok: false, error: o.fault }
  const c = o.file.channels.find((x) => x.id === channelId)
  if (!c) return { ok: false, error: 'missing' satisfies CatalogFault }
  if ((await installed(db, c.id)) === c.version)
    return { ok: true, moduleId: c.id, name: c.name, questionCount: c.questionCount }
  return net.install(packageOf(o.url, c))
}

export async function refreshCatalogs(
  db: Kysely<Database>,
  net: CatalogNet,
  catalogs: CatalogSetting[]
): Promise<CatalogRefresh> {
  const out: CatalogRefresh = { updated: [], failed: 0 }
  for (const s of catalogs) {
    if (s.channels.length === 0) continue
    const o = await open(net, s.url)
    if (!o.ok) {
      out.failed += 1
      continue
    }
    for (const id of s.channels) {
      const c = o.file.channels.find((x) => x.id === id)
      if (!c) continue
      const have = await installed(db, id)
      if (have !== null && !newer(c.version, have)) continue
      const r = await net.install(packageOf(o.url, c))
      if (r.ok) out.updated.push({ moduleId: id, name: c.name, version: c.version })
      else out.failed += 1
    }
  }
  return out
}
