import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Core } from '@core/commands'
import { CH, type BankQuestion, type BankRow, type FlagExport } from '@shared/ipc'
import { z } from 'zod'

export function registerBank(core: Core): void {
  ipcMain.handle(CH.moduleQuestions, (_e, moduleId: unknown): Promise<BankRow[]> =>
    core.module.questions(z.string().parse(moduleId))
  )

  ipcMain.handle(
    CH.moduleQuestion,
    (_e, moduleId: unknown, questionId: unknown): Promise<BankQuestion | null> =>
      core.module.question(z.string().parse(moduleId), z.string().parse(questionId))
  )

  ipcMain.handle(
    CH.flagSet,
    (_e, moduleId: unknown, questionId: unknown, flagged: unknown, note: unknown) =>
      core.flags.set(
        z.string().parse(moduleId),
        z.string().parse(questionId),
        z.boolean().parse(flagged),
        z.string().optional().parse(note)
      )
  )

  ipcMain.handle(CH.flagExport, async (e, moduleId: unknown): Promise<FlagExport> => {
    const id = z.string().parse(moduleId)
    const file = await core.flags.file(id)
    if (!file) return { ok: false }
    const w = BrowserWindow.fromWebContents(e.sender)
    const opts: Electron.SaveDialogOptions = {
      defaultPath: join(app.getPath('documents'), `${id}-flags.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }
    const r = await (w ? dialog.showSaveDialog(w, opts) : dialog.showSaveDialog(opts))
    if (r.canceled || !r.filePath) return { ok: false }
    const body = {
      modul: file.modul,
      surum: file.surum,
      disaAktarim: new Date().toISOString(),
      bayraklar: file.bayraklar
    }
    writeFileSync(r.filePath, JSON.stringify(body, null, 2) + '\n', 'utf8')
    return { ok: true, path: r.filePath, count: file.bayraklar.length }
  })
}
