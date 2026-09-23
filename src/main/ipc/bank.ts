import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Kysely } from 'kysely'
import type { Database } from '@main/db/types'
import { assetBase } from '@main/assets/protocol'
import { iterateQuestions, readMeta, type QuestionIndex } from '@main/modules/loader'
import { CH, type BankQuestion, type BankRow, type CardStatus, type FlagExport } from '@shared/ipc'
import { z } from 'zod'

function statusOf(c: { state: number; retired_at: string | null } | undefined): CardStatus {
  if (!c) return 'yeni'
  if (c.retired_at) return 'emekli'
  if (c.state === 0) return 'yeni'
  if (c.state === 2) return 'tekrar'
  return 'ogreniyor'
}

function plain(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[*_`#>$]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

export function registerBank(deps: {
  db: Kysely<Database>
  rootOf(moduleId: string): string | undefined
  refresh(): Promise<void>
  indexFor(moduleId: string): QuestionIndex
}): void {
  const { db } = deps

  const flagsOf = async (
    moduleId: string
  ): Promise<Map<string, { note: string | null; ts: string }>> => {
    const rows = await db
      .selectFrom('flag')
      .select(['question_id', 'note', 'ts'])
      .where('module_id', '=', moduleId)
      .orderBy('ts')
      .execute()
    const out = new Map<string, { note: string | null; ts: string }>()
    for (const r of rows)
      out.set(r.question_id, { note: r.note ?? out.get(r.question_id)?.note ?? null, ts: r.ts })
    return out
  }

  ipcMain.handle(CH.moduleQuestions, async (_e, moduleId: unknown): Promise<BankRow[]> => {
    await deps.refresh()
    const id = z.string().parse(moduleId)
    const root = deps.rootOf(id)
    if (!root) return []
    const cards = await db
      .selectFrom('card')
      .select(['question_id', 'state', 'retired_at', 'due', 'chapter'])
      .where('module_id', '=', id)
      .execute()
    const byQ = new Map(cards.map((c) => [c.question_id, c]))
    const flags = await flagsOf(id)
    const out: BankRow[] = []
    for (const q of iterateQuestions(readMeta(root), false)) {
      if (q.deleted) continue
      const c = byQ.get(q.id)
      const f = flags.get(q.id)
      out.push({
        questionId: q.id,
        chapter: c?.chapter ?? q.source.chapter ?? null,
        kind: q.kind,
        difficulty: q.difficulty,
        stem: plain(q.stem.md),
        status: statusOf(c),
        due: c && c.state !== 0 && !c.retired_at ? c.due : null,
        flagged: Boolean(f),
        note: f?.note ?? null
      })
    }
    return out
  })

  ipcMain.handle(
    CH.moduleQuestion,
    async (_e, moduleId: unknown, questionId: unknown): Promise<BankQuestion | null> => {
      await deps.refresh()
      const id = z.string().parse(moduleId)
      const q = deps.indexFor(id).get(z.string().parse(questionId))
      if (!q) return null
      return {
        questionId: q.id,
        stem: q.stem,
        kind: q.kind,
        choices: q.choices,
        correct: q.correct,
        beklenenCevap: q.beklenenCevap,
        solution: q.solution,
        source: q.source,
        assetBase: assetBase(id)
      }
    }
  )

  ipcMain.handle(
    CH.flagSet,
    async (_e, moduleId: unknown, questionId: unknown, flagged: unknown, note: unknown) => {
      const id = z.string().parse(moduleId)
      const qid = z.string().parse(questionId)
      if (z.boolean().parse(flagged)) {
        await db
          .insertInto('flag')
          .values({
            module_id: id,
            question_id: qid,
            ts: new Date().toISOString(),
            note: z.string().optional().parse(note) ?? null
          })
          .execute()
      } else {
        await db
          .deleteFrom('flag')
          .where('module_id', '=', id)
          .where('question_id', '=', qid)
          .execute()
      }
    }
  )

  ipcMain.handle(CH.flagExport, async (e, moduleId: unknown): Promise<FlagExport> => {
    await deps.refresh()
    const id = z.string().parse(moduleId)
    const root = deps.rootOf(id)
    if (!root) return { ok: false }
    const meta = readMeta(root).meta
    const flags = await flagsOf(id)
    const idx = deps.indexFor(id)
    const bayraklar = [...flags.entries()].map(([soru, f]) => {
      const q = idx.get(soru)
      return {
        soru,
        not: f.note,
        ts: f.ts,
        ...(q ? { kaynak: { file: q.source.file, pages: q.source.pages } } : {})
      }
    })
    const w = BrowserWindow.fromWebContents(e.sender)
    const r = await dialog.showSaveDialog(w ?? new BrowserWindow({ show: false }), {
      defaultPath: join(app.getPath('documents'), `${id}-flags.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (r.canceled || !r.filePath) return { ok: false }
    const body = {
      modul: meta.id,
      surum: meta.version,
      disaAktarim: new Date().toISOString(),
      bayraklar
    }
    writeFileSync(r.filePath, JSON.stringify(body, null, 2) + '\n', 'utf8')
    return { ok: true, path: r.filePath, count: bayraklar.length }
  })
}
