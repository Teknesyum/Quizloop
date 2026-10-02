import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'
import { sql, type Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { copyTree, listFiles, removeTree, skipBuild } from '@main/fstree'
import { validateModule } from '@core/modules/loader'
import { nodePorts } from '@main/ports'
import { getSettings, modulesDir, setSettings } from '@main/settings'
import { Work } from '@main/work'
import { CH, type Settings, type TransferResult } from '@shared/ipc'

async function copyAll(
  pairs: [string, string][],
  work: Work,
  from: number,
  to: number,
  skip?: (p: string) => boolean
): Promise<void> {
  const counts = await Promise.all(pairs.map(([src]) => listFiles(src, skip).then((f) => f.length)))
  const total = counts.reduce((a, b) => a + b, 0)
  let base = 0
  for (let i = 0; i < pairs.length; i++) {
    const [src, dst] = pairs[i]!
    await copyTree(src, dst, (d) => work.at('copy', from, to, base + d, total), skip)
    base += counts[i]!
  }
}

const MANIFEST = 'tasima.json'
const PENDING = 'quizloop.db.tasima'

function stamp(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export function applyPendingTransfer(dbFile: string): boolean {
  const pending = join(dbFile, '..', PENDING)
  if (!existsSync(pending)) return false
  const bak = dbFile + '.bak-tasima'
  for (const ext of ['', '-wal', '-shm']) {
    if (existsSync(bak + ext)) rmSync(bak + ext, { force: true })
    if (existsSync(dbFile + ext)) renameSync(dbFile + ext, bak + ext)
  }
  renameSync(pending, dbFile)
  return true
}

async function pickDir(e: IpcMainInvokeEvent, title: string): Promise<string | null> {
  const w = BrowserWindow.fromWebContents(e.sender)
  const opts: Electron.OpenDialogOptions = {
    title,
    properties: ['openDirectory', 'createDirectory']
  }
  const r = await (w ? dialog.showOpenDialog(w, opts) : dialog.showOpenDialog(opts))
  return r.canceled ? null : (r.filePaths[0] ?? null)
}

export function registerTransfer(db: Kysely<Database>): void {
  ipcMain.handle(CH.transferExport, async (e): Promise<TransferResult> => {
    const dir = await pickDir(e, 'QuizLoop')
    if (!dir) return { ok: false }
    const work = new Work('export')
    try {
      work.at('database', 0, 15)
      const target = join(dir, `QuizLoop-tasima-${stamp(new Date())}`)
      mkdirSync(join(target, 'modules'), { recursive: true })
      const dbOut = join(target, 'quizloop.db').replace(/'/g, "''")
      await sql.raw(`VACUUM INTO '${dbOut}'`).execute(db)
      const rows = await db.selectFrom('module').select(['id', 'path']).execute()
      const live = rows.filter((r) => existsSync(join(r.path, 'module.json')))
      const ids = live.map((r) => r.id)
      await copyAll(
        live.map((r) => [r.path, join(target, 'modules', r.id)]),
        work,
        15,
        100,
        skipBuild
      )
      const { modulesDir: _skip, ...settings } = getSettings()
      void _skip
      writeFileSync(
        join(target, MANIFEST),
        JSON.stringify(
          {
            app: 'quizloop',
            surum: app.getVersion(),
            olusturma: new Date().toISOString(),
            moduller: ids,
            ayarlar: settings
          },
          null,
          2
        ) + '\n'
      )
      work.finish(true)
      return { ok: true, path: target, modules: ids.length }
    } catch (err) {
      work.finish(false)
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle(CH.transferImport, async (e): Promise<TransferResult> => {
    const dir = await pickDir(e, 'QuizLoop')
    if (!dir) return { ok: false }
    const work = new Work('import')
    try {
      const manifestFile = join(dir, MANIFEST)
      const dbIn = join(dir, 'quizloop.db')
      if (!existsSync(manifestFile) || !existsSync(dbIn)) {
        return { ok: false, error: 'not-a-package' }
      }
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
        app?: string
        moduller?: string[]
        ayarlar?: Partial<Settings>
      }
      if (manifest.app !== 'quizloop') return { ok: false, error: 'not-a-package' }
      const ids = manifest.moduller ?? []
      for (const id of ids) await validateModule(nodePorts, join(dir, 'modules', id))
      work.at('copy', 0, 90)
      for (const id of ids) {
        const dest = join(modulesDir(), id)
        if (existsSync(dest)) await removeTree(dest, () => undefined)
      }
      await copyAll(
        ids.map((id) => [join(dir, 'modules', id), join(modulesDir(), id)]),
        work,
        0,
        90
      )
      work.at('database', 90, 100)
      copyFileSync(dbIn, join(app.getPath('userData'), PENDING))
      if (manifest.ayarlar) {
        const { modulesDir: _skip, ...rest } = manifest.ayarlar
        void _skip
        setSettings(rest)
      }
      setTimeout(() => {
        app.relaunch()
        app.exit(0)
      }, 400)
      work.finish(true)
      return { ok: true, path: dir, modules: ids.length }
    } catch (err) {
      work.finish(false)
      return { ok: false, error: String(err) }
    }
  })
}
