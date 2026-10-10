import { CATALOG_FAULTS, withoutChannels, type CatalogFault } from '@shared/catalog'
import { lang, t } from './i18n'
import { useApp } from './store/app'

const MB = 1_048_576
const QUIET_MS = 43_200_000

let last = 0
let running = false

export function faultText(code: string | undefined): string {
  return (CATALOG_FAULTS as readonly string[]).includes(code ?? '')
    ? t(`catalog.fault.${code as CatalogFault}`)
    : (code ?? t('catalog.fault.network'))
}

export function sizeText(bytes: number): string {
  const mb = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(
    Math.max(0.1, bytes / MB)
  )
  return t('catalog.size', { mb })
}

export async function dropChannels(moduleIds: string[]): Promise<void> {
  const app = useApp.getState()
  const catalogs = app.settings?.catalogs ?? []
  if (!catalogs.some((s) => s.channels.some((id) => moduleIds.includes(id)))) return
  await app.saveSettings({ catalogs: withoutChannels(catalogs, moduleIds) })
}

export async function refreshCatalogs(): Promise<void> {
  const now = Date.now()
  if (running || now - last < QUIET_MS) return
  running = true
  try {
    const r = await window.quizloop.catalog.refresh()
    last = now
    if (r.updated.length === 0) return
    const app = useApp.getState()
    await app.loadModules()
    app.toast(
      'success',
      t('catalog.updated', { names: r.updated.map((u) => `${u.name} ${u.version}`).join(', ') })
    )
  } finally {
    running = false
  }
}
