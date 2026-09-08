import tr from '@locale/tr.json'

export type Key = keyof typeof tr

const table: Record<string, string> = tr

export function t(key: Key, params?: Record<string, string | number>): string {
  const raw = table[key] ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}

export function upper(s: string): string {
  return s.toLocaleUpperCase('tr')
}
