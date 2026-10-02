import type { InstallResult } from '@shared/ipc'
import tr from '@locale/tr.json'
import en from '@locale/en.json'
import labelsTr from '../../../teknesyum-ui/css/labels.tr.json'
import labelsEn from '../../../teknesyum-ui/css/labels.en.json'

export type Key = keyof typeof tr | keyof typeof labelsTr

export type Lang = 'tr' | 'en'

const STORE = 'ql-lang'

function readLang(): Lang {
  try {
    return localStorage.getItem(STORE) === 'en' ? 'en' : 'tr'
  } catch {
    return 'tr'
  }
}

export const lang: Lang = readLang()

export function setLang(next: Lang): void {
  try {
    localStorage.setItem(STORE, next)
    location.reload()
  } catch {
    return
  }
}

const table: Record<string, string> =
  lang === 'en' ? { ...en, ...labelsEn } : { ...tr, ...labelsTr }

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
