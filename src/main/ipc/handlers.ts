import { app, BrowserWindow, dialog, ipcMain, shell, type IpcMainInvokeEvent } from 'electron'
import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { createCore } from '@core/commands'
import { SettingsPatch } from '@core/settings'
import { forgetPdf, kaynakBase, kaynakFile, rememberPdf, resolvePdf } from '@main/assets/kaynak'
import { assetBase } from '@main/assets/protocol'
import { installFrom, installSamples, removeModuleTree } from '@main/modules/install'
import { PACKAGE_EXT } from '@main/modules/paket'
import { nodePorts } from '@main/ports'
import { Work } from '@main/work'
import { settingsStore } from '@main/settings'
import { registerBank } from './bank'
import {
  CH,
  SOURCE_URL,
  type IntegrityReport,
  type ChapterSummary,
  type InstallConfirm,
  type InstallResult,
  type ModuleSummary,
  type Settings,
  type SourceBook,
  type StatsOverview,
  type VersionChange
} from '@shared/ipc'
import { ChoiceKey } from '@shared/schema/question'
import { z } from 'zod'

export interface Context {
  db: Kysely<Database>
  integrity: IntegrityReport
}

const SelfAssess = z.union([z.literal(1), z.literal(2), z.literal(3)])

function windowOf(e: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender)
}

export function registerHandlers(ctx: Context): {
  rootOf(moduleId: string): string | undefined
  pdfOf(moduleId: string): Promise<string | null>
  open(path: string): void
} {
  const { db } = ctx
  const core = createCore({
    db,
    ports: nodePorts,
    settings: settingsStore,
    assetBase,
    books: { path: resolvePdf, url: kaynakBase, file: kaynakFile }
  })
  const { library } = core

  ipcMain.handle(CH.appInfo, () => ({
    version: app.getVersion(),
    platform: process.platform,
    integrity: ctx.integrity
  }))

  ipcMain.on(CH.appOpenSource, () => void shell.openExternal(SOURCE_URL))

  ipcMain.on(CH.winMin, (e) => windowOf(e)?.minimize())
  ipcMain.on(CH.winMax, (e) => {
    const w = windowOf(e)
    if (!w) return
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
  })
  ipcMain.on(CH.winClose, (e) => windowOf(e)?.close())
  ipcMain.handle(CH.winIsMax, (e) => windowOf(e)?.isMaximized() ?? false)

  ipcMain.handle(CH.settingsGet, (): Settings => core.settings.get())
  ipcMain.handle(CH.settingsSet, (_e, patch: unknown) =>
    core.settings.set(SettingsPatch.parse(patch))
  )
  ipcMain.handle(CH.settingsPickDir, async (e) => {
    const w = windowOf(e)
    const r = await dialog.showOpenDialog(w ?? new BrowserWindow({ show: false }), {
      properties: ['openDirectory']
    })
    return r.canceled ? null : (r.filePaths[0] ?? null)
  })

  ipcMain.handle(CH.moduleList, (): Promise<ModuleSummary[]> => core.module.list())

  const asks = new Map<number, (yes: boolean) => void>()
  let askSeq = 0
  const ask = (change: VersionChange): Promise<boolean> =>
    new Promise((answer) => {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length === 0) return answer(true)
      const id = ++askSeq
      asks.set(id, answer)
      const confirm: InstallConfirm = { ...change, ask: id }
      for (const w of windows) w.webContents.send(CH.moduleConfirm, confirm)
    })
  ipcMain.on(CH.moduleAnswer, (_e, id: unknown, yes: unknown) => {
    const key = z.number().parse(id)
    const answer = asks.get(key)
    asks.delete(key)
    answer?.(z.boolean().parse(yes))
  })

  const install = async (path: string): Promise<InstallResult> => {
    const r = await installFrom(db, path, nodePorts.now(), new Work('install'), ask)
    await library.reload()
    return r
  }
  ipcMain.handle(CH.moduleInstall, async (_e, path: unknown) => install(z.string().parse(path)))
  ipcMain.handle(CH.moduleInstallSample, async () => {
    const r = await installSamples(db, nodePorts.now())
    await library.reload()
    return r
  })
  ipcMain.handle(CH.modulePick, async (e, kind: unknown) => {
    const w = windowOf(e)
    const file = z.enum(['file', 'folder']).parse(kind) === 'file'
    const r = await dialog.showOpenDialog(w ?? new BrowserWindow({ show: false }), {
      properties: [file ? 'openFile' : 'openDirectory'],
      filters: file ? [{ name: 'QuizLoop', extensions: [PACKAGE_EXT, 'zip'] }] : undefined
    })
    if (r.canceled || !r.filePaths[0]) return null
    return install(r.filePaths[0])
  })
  const opened: string[] = []
  let listening = false
  const announce = async (path: string): Promise<void> => {
    const r = await install(path)
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send(CH.moduleInstalled, r)
  }
  const open = (path: string): void => {
    if (listening) void announce(path)
    else opened.push(path)
  }
  ipcMain.handle(CH.moduleDrainOpened, async () => {
    listening = true
    for (const p of opened.splice(0)) await announce(p)
  })
  ipcMain.handle(CH.moduleRemove, async (_e, id: unknown) => {
    await removeModuleTree(await core.module.forget(z.string().parse(id)))
  })

  ipcMain.handle(CH.moduleReset, async (_e, id: unknown) => {
    await core.module.reset(z.string().parse(id))
  })

  ipcMain.handle(CH.moduleChapters, (_e, moduleId: unknown): Promise<ChapterSummary[]> =>
    core.module.chapters(z.string().parse(moduleId))
  )

  ipcMain.handle(CH.sessionStart, async (_e, moduleId: unknown, chapter: unknown) =>
    core.session.start(
      z.string().parse(moduleId),
      z.string().nullable().optional().parse(chapter) ?? null
    )
  )
  ipcMain.handle(CH.sessionKnown, (_e, id: unknown) => core.session.known(z.string().parse(id)))
  ipcMain.handle(CH.sessionReveal, (_e, id: unknown) => core.session.reveal(z.string().parse(id)))
  ipcMain.handle(CH.sessionAnswer, (_e, id: unknown, key: unknown) =>
    core.session.answer(z.string().parse(id), ChoiceKey.parse(key))
  )
  ipcMain.handle(CH.sessionGrade, (_e, id: unknown, self: unknown, ms: unknown) =>
    core.session.grade(z.string().parse(id), SelfAssess.parse(self), z.number().parse(ms))
  )
  ipcMain.handle(CH.sessionFlag, (_e, id: unknown, note: unknown) =>
    core.session.flag(z.string().parse(id), z.string().optional().parse(note))
  )
  ipcMain.handle(CH.sessionEnd, (_e, id: unknown) => core.session.end(z.string().parse(id)))

  ipcMain.handle(CH.sourceBook, (_e, moduleId: unknown): Promise<SourceBook> =>
    core.source.book(z.string().parse(moduleId))
  )

  ipcMain.handle(CH.sourcePickBook, async (e, moduleId: unknown): Promise<SourceBook> => {
    await library.refresh()
    const id = z.string().parse(moduleId)
    const w = windowOf(e)
    const r = await dialog.showOpenDialog(w ?? new BrowserWindow({ show: false }), {
      properties: ['openFile'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    const picked = r.canceled ? null : (r.filePaths[0] ?? null)
    if (picked) rememberPdf(id, picked)
    return core.source.book(id)
  })

  ipcMain.handle(CH.sourceForgetBook, async (_e, moduleId: unknown): Promise<SourceBook> => {
    const id = z.string().parse(moduleId)
    forgetPdf(id)
    return core.source.book(id)
  })

  ipcMain.handle(CH.statsOverview, (): Promise<StatsOverview> => core.stats.overview())

  registerBank(core)

  return {
    rootOf: (id) => library.rootOf(id),
    pdfOf: async (id) => (await core.source.peek(id)).path,
    open
  }
}
