import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { Kysely } from 'kysely'
import type { Database } from '@main/db/types'
import { assetBase } from '@main/assets/protocol'
import { installFrom, removeModule, samplePath } from '@main/modules/install'
import { QuestionIndex, readMeta } from '@main/modules/loader'
import { chapterCounts, countDue } from '@main/scheduler/queue'
import { SessionMachine } from '@main/session/machine'
import { dayStart, getSettings, setSettings } from '@main/settings'
import {
  CH,
  type IntegrityReport,
  type ChapterSummary,
  type ModuleSummary,
  type Settings,
  type StatsOverview
} from '@shared/ipc'
import { ChoiceKey } from '@shared/schema/question'
import { z } from 'zod'

export interface Context {
  db: Kysely<Database>
  integrity: IntegrityReport
}

const SelfAssess = z.union([z.literal(1), z.literal(2), z.literal(3)])
const SettingsPatch = z
  .object({
    dayStartHour: z.number().int().min(0).max(23),
    modulesDir: z.string().nullable(),
    typerSpeed: z.enum(['slow', 'normal', 'fast', 'off']),
    sessionLimit: z.number().int().min(5).max(200),
    soundOn: z.boolean()
  })
  .partial()

function windowOf(e: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender)
}

export function registerHandlers(ctx: Context): { rootOf(moduleId: string): string | undefined } {
  const { db } = ctx
  const roots = new Map<string, string>()
  const indexes = new Map<string, QuestionIndex>()

  const indexFor = (moduleId: string): QuestionIndex => {
    const hit = indexes.get(moduleId)
    if (hit) return hit
    const root = roots.get(moduleId)
    if (!root) throw new Error(`module not loaded: ${moduleId}`)
    const idx = new QuestionIndex(readMeta(root))
    indexes.set(moduleId, idx)
    return idx
  }

  const machine = new SessionMachine({
    db,
    indexFor,
    assetBase,
    dayStart: (now) => dayStart(now),
    limit: () => getSettings().sessionLimit
  })

  const refreshRoots = async (): Promise<void> => {
    const rows = await db.selectFrom('module').select(['id', 'path']).execute()
    roots.clear()
    for (const r of rows) roots.set(r.id, r.path)
    for (const id of [...indexes.keys()]) if (!roots.has(id)) indexes.delete(id)
  }

  ipcMain.handle(CH.appInfo, () => ({
    version: app.getVersion(),
    platform: process.platform,
    integrity: ctx.integrity
  }))

  ipcMain.on(CH.winMin, (e) => windowOf(e)?.minimize())
  ipcMain.on(CH.winMax, (e) => {
    const w = windowOf(e)
    if (!w) return
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
  })
  ipcMain.on(CH.winClose, (e) => windowOf(e)?.close())
  ipcMain.handle(CH.winIsMax, (e) => windowOf(e)?.isMaximized() ?? false)

  ipcMain.handle(CH.settingsGet, (): Settings => getSettings())
  ipcMain.handle(CH.settingsSet, (_e, patch: unknown): Settings =>
    setSettings(SettingsPatch.parse(patch))
  )
  ipcMain.handle(CH.settingsPickDir, async (e) => {
    const w = windowOf(e)
    const r = await dialog.showOpenDialog(w ?? new BrowserWindow({ show: false }), {
      properties: ['openDirectory']
    })
    return r.canceled ? null : (r.filePaths[0] ?? null)
  })

  ipcMain.handle(CH.moduleList, async (): Promise<ModuleSummary[]> => {
    await refreshRoots()
    const rows = await db.selectFrom('module').selectAll().orderBy('name').execute()
    const now = new Date()
    const out: ModuleSummary[] = []
    for (const r of rows) {
      const c = await countDue(db, r.id, now)
      out.push({
        id: r.id,
        name: r.name,
        version: r.version,
        path: r.path,
        questionCount: r.question_count,
        ...c
      })
    }
    return out
  })

  ipcMain.handle(CH.moduleInstall, async (_e, path: unknown) => {
    const r = await installFrom(db, z.string().parse(path), new Date())
    indexes.clear()
    await refreshRoots()
    return r
  })
  ipcMain.handle(CH.moduleInstallSample, async () => {
    const r = await installFrom(db, samplePath(), new Date())
    indexes.clear()
    await refreshRoots()
    return r
  })
  ipcMain.handle(CH.modulePick, async (e) => {
    const w = windowOf(e)
    const r = await dialog.showOpenDialog(w ?? new BrowserWindow({ show: false }), {
      properties: ['openDirectory']
    })
    if (r.canceled || !r.filePaths[0]) return null
    const res = await installFrom(db, r.filePaths[0], new Date())
    indexes.clear()
    await refreshRoots()
    return res
  })
  ipcMain.handle(CH.moduleRemove, async (_e, id: unknown) => {
    await removeModule(db, z.string().parse(id))
    indexes.clear()
    await refreshRoots()
  })

  ipcMain.handle(CH.moduleChapters, async (_e, moduleId: unknown): Promise<ChapterSummary[]> => {
    await refreshRoots()
    const id = z.string().parse(moduleId)
    const rows = await chapterCounts(db, id, new Date())
    return rows.map((r) => ({ chapter: r.chapter, total: r.total, ...r.count }))
  })

  ipcMain.handle(CH.sessionStart, async (_e, moduleId: unknown, chapter: unknown) => {
    await refreshRoots()
    return machine.start(
      z.string().parse(moduleId),
      z.string().nullable().optional().parse(chapter) ?? null
    )
  })
  ipcMain.handle(CH.sessionKnown, (_e, id: unknown) => machine.known(z.string().parse(id)))
  ipcMain.handle(CH.sessionReveal, (_e, id: unknown) => machine.reveal(z.string().parse(id)))
  ipcMain.handle(CH.sessionAnswer, (_e, id: unknown, key: unknown) =>
    machine.answer(z.string().parse(id), ChoiceKey.parse(key))
  )
  ipcMain.handle(CH.sessionGrade, (_e, id: unknown, self: unknown, ms: unknown) =>
    machine.grade(z.string().parse(id), SelfAssess.parse(self), z.number().parse(ms))
  )
  ipcMain.handle(CH.sessionFlag, (_e, id: unknown, note: unknown) =>
    machine.flag(z.string().parse(id), z.string().optional().parse(note))
  )
  ipcMain.handle(CH.sessionEnd, (_e, id: unknown) => machine.end(z.string().parse(id)))

  ipcMain.handle(CH.statsOverview, async (): Promise<StatsOverview> => {
    const now = new Date()
    const modules = await db
      .selectFrom('module')
      .select(db.fn.countAll<number>().as('n'))
      .executeTakeFirstOrThrow()
    const cards = await db
      .selectFrom('card')
      .select(db.fn.countAll<number>().as('n'))
      .where('orphaned', '=', 0)
      .executeTakeFirstOrThrow()
    const retired = await db
      .selectFrom('card')
      .select(db.fn.countAll<number>().as('n'))
      .where('retired_at', 'is not', null)
      .executeTakeFirstOrThrow()
    const dueToday = await db
      .selectFrom('card')
      .select(db.fn.countAll<number>().as('n'))
      .where('retired_at', 'is', null)
      .where('orphaned', '=', 0)
      .where('due', '<=', now.toISOString())
      .where('state', '!=', 0)
      .executeTakeFirstOrThrow()
    const reviewsTotal = await db
      .selectFrom('review_log')
      .select(db.fn.countAll<number>().as('n'))
      .where('kind', '!=', 'migration')
      .executeTakeFirstOrThrow()
    const since = new Date(now.getTime() - 30 * 86400000).toISOString()
    const logs = await db
      .selectFrom('review_log')
      .select(['ts', 'wrong_picks'])
      .where('kind', '!=', 'migration')
      .where('ts', '>=', since)
      .execute()
    const byDay = new Map<string, { reviews: number; correct: number }>()
    for (const l of logs) {
      const day = dayStart(new Date(l.ts)).toISOString().slice(0, 10)
      const e = byDay.get(day) ?? { reviews: 0, correct: 0 }
      e.reviews++
      if (l.wrong_picks === 0) e.correct++
      byDay.set(day, e)
    }
    const perDay = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }))
    const sevenAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
    const reviews7d = perDay.filter((d) => d.day >= sevenAgo).reduce((a, d) => a + d.reviews, 0)
    let streak = 0
    const cursor = dayStart(now)
    while (byDay.has(cursor.toISOString().slice(0, 10))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return {
      modules: Number(modules.n),
      cards: Number(cards.n),
      dueToday: Number(dueToday.n),
      reviewsTotal: Number(reviewsTotal.n),
      reviews7d,
      retired: Number(retired.n),
      streakDays: streak,
      perDay
    }
  })

  return { rootOf: (id) => roots.get(id) }
}
