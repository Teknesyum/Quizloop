import { app, BrowserWindow, ipcMain, net, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CH, type UpdateStatus } from '@shared/ipc'

const OWNER = 'Teknesyum'
const REPO = 'Quizloop'
const RELEASES = `https://github.com/${OWNER}/${REPO}/releases`

let status: UpdateStatus = { state: 'idle' }

function emit(next: UpdateStatus): void {
  status = next
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send(CH.updateChanged, status)
}

export function newer(latest: string, current: string): boolean {
  const parse = (v: string): number[] =>
    v
      .replace(/^v/, '')
      .split(/[.-]/)
      .slice(0, 3)
      .map((n) => Number.parseInt(n, 10) || 0)
  const a = parse(latest)
  const b = parse(current)
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  }
  return false
}

function nativeUpdates(): boolean {
  return (
    process.platform === 'win32' &&
    app.isPackaged &&
    existsSync(join(process.resourcesPath, 'app-update.yml'))
  )
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

function check(): Promise<UpdateStatus> {
  if (!app.isPackaged) {
    emit({ state: 'none' })
    return Promise.resolve(status)
  }
  return nativeUpdates() ? checkNative() : checkNotice()
}

export function registerUpdates(): void {
  if (nativeUpdates()) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('checking-for-update', () => emit({ state: 'checking' }))
    autoUpdater.on('update-not-available', () => emit({ state: 'none' }))
    autoUpdater.on('update-available', (i) => emit({ state: 'available', version: i.version }))
    autoUpdater.on('download-progress', (p) =>
      emit({ state: 'downloading', version: status.version, percent: Math.round(p.percent) })
    )
    autoUpdater.on('update-downloaded', (i) => emit({ state: 'ready', version: i.version }))
    autoUpdater.on('error', (e) => emit({ state: 'error', error: e.message }))
  }

  ipcMain.handle(CH.updateStatus, () => status)
  ipcMain.handle(CH.updateCheck, () => check())
  ipcMain.on(CH.updateInstall, () => {
    if (status.state === 'ready') autoUpdater.quitAndInstall()
  })
  ipcMain.on(CH.updateOpen, () => {
    const url = status.url && status.url.startsWith(RELEASES) ? status.url : RELEASES
    void shell.openExternal(url)
  })

  setTimeout(() => void check(), 8000)
}
