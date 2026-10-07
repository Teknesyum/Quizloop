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
  UpdateStatus,
  VersionChange,
  WorkProgress
} from '@shared/ipc'
import { loadBundle } from '../android/ports'
import { openDatabase } from './db/open'
import { loadSettings } from './settings'
import { openStore } from './store'

const UNSUPPORTED: TransferResult = { ok: false }
const IDLE: UpdateStatus = { state: 'idle' }
const off = (): void => undefined

function capabilities(): Capabilities {
  const keyboard = matchMedia('(hover: hover) and (pointer: fine)').matches
  return {
    windowChrome: false,
    shortcuts: keyboard,
    pinchZoom: !keyboard,
    backButton: false,
    updater: false,
    folders: false,
    settingsFile: false,
    packageImport: true
  }
}

export async function createShell(): Promise<QuizloopApi> {
  const t0 = performance.now()
  const opened = await openDatabase()
  const { db } = opened
  const bundleRoot = new URL('bundled', document.baseURI).pathname
  const bundle = await loadBundle(bundleRoot)
  const store = openStore(bundle.ports, bundleRoot)
  const { ports } = store
  const settings = loadSettings()
  let core: Core | null = null
  core = createCore({
    db,
    ports,
    settings,
    books: {
      path: () => null,
      url: () => '',
      file: (root, rel) => `${root}/${rel.split('/').map(encodeURIComponent).join('/')}`
    },
    assetBase: (id) => `${core?.library.rootOf(id) ?? ''}/`
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

  if (opened.firstRun) await installBundled()
  else
    await resyncFolders(
      db,
      ports,
      async (r) => (bundle.roots.includes(r.path) ? r.path : store.locate(r)),
      ports.now()
    )
  await c.library.reload()
  const swept = await store.sweep(db).catch(() => 0)
  const persisted = (await navigator.storage?.persist?.().catch(() => false)) ?? false
  console.info(
    `[quizloop] boot ${JSON.stringify({
      integrity: opened.integrity.detail,
      firstRun: opened.firstRun,
      migrated: opened.migrated,
      swept,
      persisted,
      totalMs: Math.round(performance.now() - t0)
    })}`
  )

  const watchers = new Set<(p: WorkProgress) => void>()
  const emit = (p: WorkProgress): void => {
    for (const cb of watchers) cb(p)
  }
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

  return {
    capabilities: capabilities(),
    pathOf: () => null,
    app: {
      info: async () => ({
        version: __APP_VERSION__,
        platform: 'web',
        integrity: opened.integrity
      }),
      onBack: () => off,
      openSource: () => void window.open(SOURCE_URL, '_blank', 'noopener')
    },
    window: {
      minimize: off,
      toggleMaximize: off,
      close: off,
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
        const file = await store.pick()
        if (!file) return null
        const r = await store.install(file, db, emit, ask)
        if (r.ok) await c.library.reload()
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
    flags: {
      set: (id, qid, flagged, note) => c.flags.set(id, qid, flagged, note),
      export: async () => ({ ok: false })
    },
    update: {
      status: async () => IDLE,
      check: async () => IDLE,
      download: off,
      cancel: off,
      install: off,
      open: off,
      onStatus: () => off
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
