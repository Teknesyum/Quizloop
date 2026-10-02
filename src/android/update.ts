import { Browser } from '@capacitor/browser'
import { CapacitorHttp } from '@capacitor/core'
import { newer } from '@core/version'
import type { UpdateStatus } from '@shared/ipc'

const OWNER = 'Teknesyum'
const REPO = 'Quizloop'
const RELEASES = `https://github.com/${OWNER}/${REPO}/releases`
const LATEST = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`

export interface AndroidUpdates {
  status(): Promise<UpdateStatus>
  check(): Promise<UpdateStatus>
  open(): void
  onStatus(cb: (s: UpdateStatus) => void): () => void
}

export function createUpdates(current: string): AndroidUpdates {
  let status: UpdateStatus = { state: 'idle' }
  const listeners = new Set<(s: UpdateStatus) => void>()

  const emit = (next: UpdateStatus): UpdateStatus => {
    status = next
    for (const cb of listeners) cb(status)
    return status
  }

  const check = async (): Promise<UpdateStatus> => {
    emit({ state: 'checking' })
    try {
      const res = await CapacitorHttp.get({
        url: LATEST,
        headers: { accept: 'application/vnd.github+json' },
        connectTimeout: 10000,
        readTimeout: 10000
      })
      if (res.status !== 200) return emit({ state: 'none' })
      const body = res.data as { tag_name?: string; html_url?: string }
      const tag = body.tag_name ?? ''
      if (tag && newer(tag, current)) {
        const url = body.html_url?.startsWith(RELEASES) ? body.html_url : RELEASES
        return emit({ state: 'notice', version: tag.replace(/^v/, ''), url })
      }
      return emit({ state: 'none' })
    } catch (e) {
      return emit({ state: 'error', error: String(e) })
    }
  }

  return {
    status: async () => status,
    check,
    open: () => {
      const url = status.url?.startsWith(RELEASES) ? status.url : RELEASES
      void Browser.open({ url })
    },
    onStatus: (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    }
  }
}
