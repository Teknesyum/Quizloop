import type { CatalogSetting } from './ipc'

const LOCAL = new Set(['localhost', '127.0.0.1'])

export const CATALOG_FAULTS = ['address', 'network', 'format', 'hash', 'missing'] as const
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
