import { domToJpeg } from 'modern-screenshot'
import { REPORT_APP, REPORT_URL, type ReportContext, type ReportTicket } from '@shared/bildirim'
import { lang } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { useSession } from '@renderer/store/session'

const SHOT_WIDTH = 900
const SHOT_MS = 4000
const SEND_MS = 20000

export const reportEnabled = REPORT_URL !== ''

async function shot(): Promise<string | null> {
  const root = document.body
  const scale = Math.min(1, SHOT_WIDTH / Math.max(1, root.clientWidth))
  const work = domToJpeg(root, {
    quality: 0.6,
    scale,
    backgroundColor: getComputedStyle(root).backgroundColor,
    timeout: SHOT_MS,
    onCloneEachNode: (n) => {
      if (!(n instanceof HTMLElement || n instanceof SVGElement)) return
      n.style.animation = 'none'
      n.style.transition = 'none'
    },
    filter: (n) => !(n instanceof Element && n.hasAttribute('data-ql-noshot'))
  }).catch(() => null)
  const late = new Promise<null>((done) => setTimeout(() => done(null), SHOT_MS))
  return Promise.race([work, late])
}

function context(): ReportContext {
  const app = useApp.getState()
  const state = useSession.getState().state
  const route = app.route
  return {
    version: app.info?.version ?? '',
    platform: app.info?.platform ?? '',
    route: 'chapter' in route && route.chapter ? `${route.name} · ${route.chapter}` : route.name,
    moduleId: 'moduleId' in route ? route.moduleId : null,
    questionId: route.name === 'session' && 'q' in state ? state.q.questionId : null,
    lang,
    view: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
    agent: navigator.userAgent
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(REPORT_URL + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(SEND_MS)
  })
  if (!res.ok) throw new Error(String(res.status))
  return (await res.json()) as T
}

export async function sendReport(note: string, withShot: boolean): Promise<ReportTicket> {
  const ctx = context()
  const image = withShot ? await shot() : null
  return post<ReportTicket>('/bildir', { app: REPORT_APP, note, shot: withShot, image, ctx })
}
