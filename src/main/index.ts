import { app, BrowserWindow, session } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerAssetProtocol } from './assets/protocol'
import { openDatabase } from './db'
import { registerHandlers } from './ipc/handlers'
import { installFrom, resyncAll, samplePath } from './modules/install'
import { isPackage } from './modules/paket'
import { applyPendingTransfer, registerTransfer } from './transfer'
import { announceUpdated, registerUpdates } from './update'
import { createWindow } from './window'

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "img-src 'self' quizloop: data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' quizloop:",
  "worker-src 'self' blob:"
].join('; ')

const early: string[] = process.argv.slice(1).filter(isPackage)
let open = (path: string): void => {
  early.push(path)
}

async function boot(): Promise<void> {
  electronApp.setAppUserModelId('com.teknesyum.quizloop')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  const dbFile = join(app.getPath('userData'), 'quizloop.db')
  applyPendingTransfer(dbFile)
  const firstRun = !existsSync(dbFile)
  const opened = await openDatabase(dbFile)
  const now = new Date()

  if (firstRun && existsSync(samplePath())) await installFrom(opened.db, samplePath(), now)
  await resyncAll(opened.db, now)

  const handlers = registerHandlers({ db: opened.db, integrity: opened.integrity })
  const { rootOf, pdfOf } = handlers
  open = handlers.open
  for (const p of early.splice(0)) open(p)
  registerAssetProtocol(rootOf, pdfOf)
  registerTransfer(opened.db)
  registerUpdates()
  announceUpdated()

  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] } })
  })

  createWindow(icon)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(icon)
  })
  app.on('will-quit', () => opened.raw.close())
}

app.on('open-file', (e, path) => {
  e.preventDefault()
  if (isPackage(path)) open(path)
})

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', (_e, argv) => {
    for (const p of argv.slice(1).filter(isPackage)) open(p)
    const w = BrowserWindow.getAllWindows()[0]
    if (w) {
      if (w.isMinimized()) w.restore()
      w.focus()
    }
  })
  app.whenReady().then(boot)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
