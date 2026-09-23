import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'
import { sql, type Kysely } from 'kysely'
import type { Database } from '@main/db/types'
import { validateModule } from '@main/modules/loader'
import { getSettings, modulesDir, setSettings } from '@main/settings'
import { CH, type Settings, type TransferResult } from '@shared/ipc'

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
  const r = await dialog.showOpenDialog(w ?? new BrowserWindow({ show: false }), {
    title,
    properties: ['openDirectory', 'createDirectory']
  })
  return r.canceled ? null : (r.filePaths[0] ?? null)
}

export function registerTransfer(db: Kysely<Database>): void {
  ipcMain.handle(CH.transferExport, async (e): Promise<TransferResult> => {
    const dir = await pickDir(e, 'Quizloop')
    if (!dir) return { ok: false }
    try {
      const target = join(dir, `Quizloop-tasima-${stamp(new Date())}`)
      mkdirSync(join(target, 'modules'), { recursive: true })
      const dbOut = join(target, 'quizloop.db').replace(/'/g, "''")
      await sql.raw(`VACUUM INTO '${dbOut}'`).execute(db)
      const rows = await db.selectFrom('module').select(['id', 'path']).execute()
      const ids: string[] = []
      for (const r of rows) {
        if (!existsSync(join(r.path, 'module.json'))) continue
        cpSync(r.path, join(target, 'modules', r.id), {
          recursive: true,
          filter: (p) => !/[\\/]build([\\/]|$)/.test(p)
        })
        ids.push(r.id)
      }
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
      return { ok: true, path: target, modules: ids.length }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle(CH.transferImport, async (e): Promise<TransferResult> => {
    const dir = await pickDir(e, 'Quizloop')
    if (!dir) return { ok: false }
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
      for (const id of ids) validateModule(join(dir, 'modules', id))
      for (const id of ids) {
        const dest = join(modulesDir(), id)
        if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
        cpSync(join(dir, 'modules', id), dest, { recursive: true })
      }
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
      return { ok: true, path: dir, modules: ids.length }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
}
