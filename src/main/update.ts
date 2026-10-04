import { app, BrowserWindow, ipcMain, net, shell } from 'electron'
import { autoUpdater, CancellationToken } from 'electron-updater'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { offers, type KodManifest } from '@core/kod'
import { newer } from '@core/version'
import { downloadKod, fetchManifest } from '@main/kod'
import { readState } from '@main/kodstate'
import { getSettings } from '@main/settings'
import { CH, type UpdateStatus } from '@shared/ipc'

const OWNER = 'Teknesyum'
const REPO = 'Quizloop'
const RELEASES = `https://github.com/${OWNER}/${REPO}/releases`

export { newer }

let status: UpdateStatus = { state: 'idle' }
let cancel: CancellationToken | null = null
let installAfter = false
let kod: KodManifest | null = null
let abort: AbortController | null = null

const RECHECK_MS = 30 * 60 * 1000

function emit(next: UpdateStatus): void {
  status = next
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send(CH.updateChanged, status)
}

function nativeUpdates(): boolean {
  return (
    process.platform === 'win32' &&
    app.isPackaged &&
    existsSync(join(process.resourcesPath, 'app-update.yml'))
  )
}

function kodUpdates(): boolean {
  return process.platform === 'win32' && app.isPackaged
}

function restart(): void {
  app.relaunch()
  app.quit()
}

async function checkKod(): Promise<boolean> {
  emit({ state: 'checking' })
  const manifest = await fetchManifest()
  if (!manifest || !offers(manifest, app.getVersion(), __KABUK__, readState())) return false
  kod = manifest
  emit({ state: 'available', version: manifest.version })
  if (getSettings().autoUpdate) download(false)
  return true
}

async function downloadCode(manifest: KodManifest): Promise<void> {
  const mine = new AbortController()
  abort = mine
  emit({ state: 'downloading', version: manifest.version, percent: 0 })
  try {
    await downloadKod(
      manifest,
      (percent) => emit({ state: 'downloading', version: manifest.version, percent }),
      mine.signal
    )
    abort = null
    emit({ state: 'ready', version: manifest.version })
    if (installAfter) restart()
  } catch (e) {
    abort = null
    if (mine.signal.aborted) {
      emit({ state: 'available', version: manifest.version })
      return
    }
    kod = null
    if (nativeUpdates()) await checkNative()
    else emit({ state: 'error', error: String(e) })
  }
}

async function checkNotice(): Promise<UpdateStatus> {
  emit({ state: 'checking' })
  try {
    const res = await net.fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'Quizloop' }
    })
    if (!res.ok) {
      emit({ state: 'none' })
      return status
    }
    const body = (await res.json()) as { tag_name?: string; html_url?: string }
    const tag = body.tag_name ?? ''
    if (tag && newer(tag, app.getVersion())) {
      emit({ state: 'notice', version: tag.replace(/^v/, ''), url: body.html_url ?? RELEASES })
    } else emit({ state: 'none' })
  } catch (e) {
    emit({ state: 'error', error: String(e) })
  }
  return status
}

async function checkNative(): Promise<UpdateStatus> {
  try {
    await autoUpdater.checkForUpdates()
  } catch (e) {
    emit({ state: 'error', error: String(e) })
  }
  return status
}

function download(install: boolean): void {
  if (status.state !== 'available') return
  installAfter = install
  if (kod) {
    void downloadCode(kod)
    return
  }
  cancel = new CancellationToken()
  emit({ state: 'downloading', version: status.version, percent: 0 })
  autoUpdater.downloadUpdate(cancel).catch(() => undefined)
}

async function check(): Promise<UpdateStatus> {
  if (status.state === 'downloading' || status.state === 'ready') return status
  if (!app.isPackaged) {
    emit({ state: 'none' })
    return status
  }
  kod = null
  if (kodUpdates() && (await checkKod())) return status
  return nativeUpdates() ? checkNative() : checkNotice()
}

export function registerUpdates(): void {
  if (nativeUpdates()) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('checking-for-update', () => emit({ state: 'checking' }))
    autoUpdater.on('update-not-available', () => emit({ state: 'none' }))
    autoUpdater.on('update-available', (i) => {
      emit({ state: 'available', version: i.version })
      if (getSettings().autoUpdate) download(false)
    })
    autoUpdater.on('download-progress', (p) =>
      emit({ state: 'downloading', version: status.version, percent: Math.round(p.percent) })
    )
    autoUpdater.on('update-downloaded', (i) => {
      cancel = null
      emit({ state: 'ready', version: i.version })
      if (installAfter) autoUpdater.quitAndInstall(true, true)
    })
    autoUpdater.on('update-cancelled', (i) => emit({ state: 'available', version: i.version }))
    autoUpdater.on('error', (e) => {
      if (status.state === 'downloading' && !cancel) return
      emit({ state: 'error', error: e.message })
    })
  }

  ipcMain.handle(CH.updateStatus, () => status)
  ipcMain.handle(CH.updateCheck, () => check())
  ipcMain.on(CH.updateDownload, (_e, install: boolean) => download(install === true))
  ipcMain.on(CH.updateCancel, () => {
    if (status.state === 'downloading' && abort) {
      installAfter = false
      abort.abort()
      return
    }
    if (status.state !== 'downloading' || !cancel) return
    const token = cancel
    cancel = null
    installAfter = false
    token.cancel()
  })
  ipcMain.on(CH.updateInstall, () => {
    if (status.state !== 'ready') return
    if (kod) restart()
    else autoUpdater.quitAndInstall(true, true)
  })
  ipcMain.on(CH.updateOpen, () => {
    const url = status.url && status.url.startsWith(RELEASES) ? status.url : RELEASES
    void shell.openExternal(url)
  })

  setTimeout(() => void check(), 8000)
  setInterval(() => void check(), RECHECK_MS)
}

export function announceUpdated(): void {
  if (!app.isPackaged) return
  const file = join(app.getPath('userData'), 'version.txt')
  const now = app.getVersion()
  let before = ''
  try {
    before = readFileSync(file, 'utf8').trim()
  } catch {
    before = ''
  }
  try {
    writeFileSync(file, now)
  } catch {
    return
  }
  if (before && newer(now, before)) emit({ state: 'updated', version: now })
}
