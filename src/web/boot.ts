import { t } from '@renderer/i18n'
import { installPdfWorker } from '../android/pdfworker'
import { createShell } from './shell'

const CONTROL_WAIT_MS = 3000
const UPDATE_WAIT_MS = 3000
const INSTALL_WAIT_MS = 15000

function controlled(): Promise<void> {
  return new Promise<void>((done) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true })
    setTimeout(done, CONTROL_WAIT_MS)
  })
}

function settled(worker: ServiceWorker): Promise<void> {
  return new Promise<void>((done) => {
    const seen = (): void => {
      if (worker.state !== 'installing') done()
    }
    worker.addEventListener('statechange', seen)
    setTimeout(done, INSTALL_WAIT_MS)
    seen()
  })
}

async function pending(reg: ServiceWorkerRegistration): Promise<ServiceWorker | null> {
  if (reg.waiting) return reg.waiting
  await Promise.race([
    reg.update().catch(() => undefined),
    new Promise<void>((done) => setTimeout(done, UPDATE_WAIT_MS))
  ])
  if (reg.installing) await settled(reg.installing)
  return reg.waiting
}

async function serve(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.register('./sw.js')
  await navigator.serviceWorker.ready
  if (!navigator.serviceWorker.controller) return controlled()
  const next = await pending(reg)
  if (!next) return
  const taken = controlled()
  next.postMessage('skip')
  await taken
  location.reload()
  await new Promise<never>(() => {})
}

installPdfWorker()

serve()
  .catch((e: unknown) => console.warn(`[quizloop] service worker ${String(e)}`))
  .then(createShell)
  .then((api) => {
    window.quizloop = api
    return import('@renderer/main')
  })
  .catch((e: unknown) => {
    const box = document.getElementById('root') ?? document.body
    const busy = /access handle|NoModificationAllowed|SAH/i.test(String(e))
    box.textContent = busy ? t('web.oneTab') : `${t('android.bootFailed')} ${String(e)}`
    console.error('[quizloop] boot failed', e)
  })
