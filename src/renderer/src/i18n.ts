import type { InstallResult } from '@shared/ipc'
import tr from '@locale/tr.json'
import labels from '../../../teknesyum-ui/css/labels.tr.json'

export type Key = keyof typeof tr | keyof typeof labels

const table: Record<string, string> = { ...tr, ...labels }

export function t(key: Key, params?: Record<string, string | number>): string {
  const raw = table[key] ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}

export function upper(s: string): string {
  return s.toLocaleUpperCase('tr')
}

export function installedText(r: InstallResult): string {
  const params = { name: r.name ?? r.moduleId ?? '', count: r.questionCount ?? 0 }
  return t('library.installed', params)
}

export function title(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1))
    .join(' ')
}
