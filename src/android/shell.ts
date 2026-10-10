import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { LocalNotifications } from '@capacitor/local-notifications'
import { createCore, type Core } from '@core/commands'
import { installFailure, resyncFolders, syncFolder } from '@core/commands/modules'
import { SettingsPatch } from '@core/settings'
import { SOURCE_URL } from '@shared/ipc'
import type {
  Capabilities,
  InstallConfirm,
  InstallResult,
  QuizloopApi,
  TransferResult,
  VersionChange,
  WorkProgress
} from '@shared/ipc'
import { openDatabase } from './db/open'
import { openStore } from './paket'
import { BUNDLE_ROOT, loadBundle } from './ports'
import { loadSettings } from './settings'
import { createUpdates } from './update'

export const ANDROID_CAPABILITIES: Capabilities = {
  windowChrome: false,
  shortcuts: false,
  pinchZoom: true,
  backButton: true,
  updater: true,
  folders: false,
  settingsFile: false,
  packageImport: true,
  catalogs: false
}

const UNSUPPORTED: TransferResult = { ok: false }
const off = (): void => undefined

function log(event: string, data: Record<string, unknown>): void {
  console.info(`[quizloop] ${event} ${JSON.stringify(data)}`)
}

export async function createShell(): Promise<QuizloopApi> {
  const t0 = performance.now()
  const version = await App.getInfo().then(
    (i) => i.version,
    () => '0.0.0'
  )
  const opened = await openDatabase(version)
  const tDb = performance.now()
  const { db } = opened
  const bundle = await loadBundle()
  const store = await openStore(bundle.ports, BUNDLE_ROOT)
  const { ports } = store
  const settings = await loadSettings()
  let core: Core | null = null
  core = createCore({
    db,
    ports,
    settings,
    books: {
      path: () => null,
      url: () => '',
      file: (root, rel) => `${store.url(root)}/${rel.split('/').map(encodeURIComponent).join('/')}`
    },
    assetBase: (id) => `${store.url(core?.library.rootOf(id) ?? '')}/`
  })
  const c = core

  const installBundled = async (): Promise<InstallResult> => {
    let last: InstallResult = { ok: false }
    for (const root of bundle.roots) {
      try {
        last = await syncFolder(db, ports, root, ports.now())
      } catch (e) {
        last = installFailure(e)
      }
    }
    await c.library.reload()
    return last
  }

  const tSync0 = performance.now()
  if (opened.firstRun) await installBundled()
  else
    await resyncFolders(
      db,
      ports,
      async (r) => (bundle.roots.includes(r.path) ? r.path : store.locate(r)),
      ports.now()
    )
  await c.library.reload()
  const tSync = performance.now()
  log('boot', {
    journal: opened.journal,
    integrity: opened.integrity.detail,
    firstRun: opened.firstRun,
    migrated: opened.migrated,
    backup: opened.backup,
    openMs: Math.round(tDb - t0),
    syncMs: Math.round(tSync - tSync0),
    totalMs: Math.round(tSync - t0),
    webview: navigator.userAgent
  })

  const backs = new Set<() => void>()
  const watchers = new Set<(p: WorkProgress) => void>()
  const emit = (p: WorkProgress): void => {
    for (const cb of watchers) cb(p)
  }
  await App.addListener('backButton', () => {
    for (const cb of backs) cb()
  })
  await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) return
    void opened.resume().then((reopened) => {
      if (reopened) log('reopen', { generation: opened.generation() })
    })
  })

  const info = await App.getInfo().catch(() => ({ version: '0.0.0' }))
  const updates = createUpdates(info.version)
  const confirmers = new Set<(c: InstallConfirm) => void>()
  const asks = new Map<number, (yes: boolean) => void>()
  let askSeq = 0
  const ask = (change: VersionChange): Promise<boolean> =>
    new Promise((answer) => {
      if (confirmers.size === 0) return answer(true)
      const id = ++askSeq
      asks.set(id, answer)
      for (const cb of confirmers) cb({ ...change, ask: id })
    })
  updates.start()

  return {
    capabilities: ANDROID_CAPABILITIES,
    notify: {
      ask: async () => {
        const has = await LocalNotifications.checkPermissions()
        if (has.display === 'granted') return true
        return (await LocalNotifications.requestPermissions()).display === 'granted'
      },
      plan: async (items) => {
        const has = await LocalNotifications.checkPermissions()
        if (has.display !== 'granted') return
        const pending = await LocalNotifications.getPending()
        if (pending.notifications.length)
          await LocalNotifications.cancel({
            notifications: pending.notifications.map((n) => ({ id: n.id }))
          })
        if (!items.length) return
        await LocalNotifications.schedule({
          notifications: items.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            schedule: { at: new Date(n.at), allowWhileIdle: true }
          }))
        })
      }
    },
    pathOf: () => null,
    app: {
      info: async () => ({
        version: info.version,
        platform: 'android',
        integrity: opened.integrity
      }),
      onBack: (cb) => {
        backs.add(cb)
        return () => backs.delete(cb)
      },
      openSource: () => void Browser.open({ url: SOURCE_URL })
    },
    window: {
      minimize: () => void App.minimizeApp(),
      toggleMaximize: off,
      close: () => void App.exitApp(),
      isMaximized: async () => true,
      onMaximized: () => off
    },
    settings: {
      get: async () => c.settings.get(),
      set: async (patch) => c.settings.set(SettingsPatch.parse(patch)),
      zoom: (factor) => {
        document.documentElement.style.setProperty('zoom', String(factor))
      },
      pickModulesDir: async () => null
    },
    module: {
      list: () => c.module.list(),
      install: async () => ({ ok: false }),
      installSample: installBundled,
      pick: async (kind) => {
        if (kind !== 'file') return null
        const r = await store.install(db, emit, ask)
        if (r?.ok) await c.library.reload()
        return r
      },
      onInstalled: () => off,
      drainOpened: async () => undefined,
      onConfirm: (cb) => {
        confirmers.add(cb)
        return () => confirmers.delete(cb)
      },
      answer: (id, yes) => {
        const answer = asks.get(id)
        asks.delete(id)
        answer?.(yes)
      },
      remove: async (id) => {
        await store.remove(await c.module.forget(id))
      },
      reset: (id, chapter) => c.module.reset(id, chapter),
      chapters: (id) => c.module.chapters(id),
      questions: (id) => c.module.questions(id),
      question: (id, qid) => c.module.question(id, qid)
    },
    catalog: {
      read: async () => ({ ok: false, fault: 'network' }),
      install: async () => ({ ok: false }),
      refresh: async () => ({ updated: [], failed: 0 })
    },
    flags: {
      set: (id, qid, flagged, note) => c.flags.set(id, qid, flagged, note),
      export: async () => ({ ok: false })
    },
    update: {
      status: updates.status,
      check: updates.check,
      download: off,
      cancel: off,
      install: off,
      open: updates.open,
      onStatus: updates.onStatus
    },
    transfer: {
      exportTo: async () => UNSUPPORTED,
      importFrom: async () => UNSUPPORTED
    },
    session: c.session,
    source: {
      book: (id) => c.source.book(id),
      pickBook: (id) => c.source.book(id),
      forgetBook: (id) => c.source.book(id)
    },
    work: {
      onProgress: (cb) => {
        watchers.add(cb)
        return () => watchers.delete(cb)
      }
    },
    stats: {
      overview: () => c.stats.overview()
    }
  }
}
