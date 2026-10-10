import type { CatalogSetting } from './ipc'
import { BLOCKED } from './blocked'

const LOCAL = new Set(['localhost', '127.0.0.1'])

export const CATALOG_FAULTS = [
  'address',
  'network',
  'format',
  'hash',
  'missing',
  'blocked'
] as const
export type CatalogFault = (typeof CATALOG_FAULTS)[number]

export function catalogAddress(input: string): string | null {
  let u: URL
  try {
    u = new URL(input.trim())
  } catch {
    return null
  }
  if (u.username || u.password) return null
  const local = u.protocol === 'http:' && LOCAL.has(u.hostname)
  if (u.protocol !== 'https:' && !local) return null
  u.hash = ''
  return u.href
}

export function packageAddress(catalog: string, pkg: string): string | null {
  try {
    return catalogAddress(new URL(pkg, catalog).href)
  } catch {
    return null
  }
}

export function addressBlocked(url: string, list: readonly string[] = BLOCKED): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  const host = u.hostname.toLocaleLowerCase('en')
  const href = u.href.toLocaleLowerCase('en')
  return list.some((raw) => {
    const e = raw.trim().toLocaleLowerCase('en')
    if (!e) return false
    if (e.includes('://')) return href.startsWith(e)
    return host === e || host.endsWith(`.${e}`)
  })
}

export function hashBlocked(sha256: string, list: readonly string[] = BLOCKED): boolean {
  const h = sha256.toLocaleLowerCase('en')
  return list.some((raw) => raw.trim().toLocaleLowerCase('en') === h)
}

export function catalogHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function catalogOf(
  catalogs: CatalogSetting[],
  moduleId: string
): CatalogSetting | undefined {
  return catalogs.find((s) => s.channels.includes(moduleId))
}

export function withoutChannels(catalogs: CatalogSetting[], moduleIds: string[]): CatalogSetting[] {
  return catalogs.map((s) => ({
    ...s,
    channels: s.channels.filter((id) => !moduleIds.includes(id))
  }))
}
