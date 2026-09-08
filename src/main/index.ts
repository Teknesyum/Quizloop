import { app, BrowserWindow, session } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerAssetProtocol } from './assets/protocol'
import { openDatabase } from './db'
import { registerHandlers } from './ipc/handlers'
import { installFrom, resyncAll, samplePath } from './modules/install'
import { createWindow } from './window'

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "img-src 'self' quizloop: data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'"
].join('; ')

async function boot(): Promise<void> {
  electronApp.setAppUserModelId('com.teknesyum.quizloop')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  const dbFile = join(app.getPath('userData'), 'quizloop.db')
  const firstRun = !existsSync(dbFile)
  const opened = await openDatabase(dbFile)
  const now = new Date()

  if (firstRun && existsSync(samplePath())) await installFrom(opened.db, samplePath(), now)
  await resyncAll(opened.db, now)

  const { rootOf } = registerHandlers({ db: opened.db, integrity: opened.integrity })
  registerAssetProtocol(rootOf)

  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] } })
  })

  createWindow(icon)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(icon)
  })
  app.on('will-quit', () => opened.raw.close())
}

app.whenReady().then(boot)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
