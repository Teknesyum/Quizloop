import { t } from '@renderer/i18n'
import { installPdfWorker } from '../android/pdfworker'
import { createShell } from './shell'

const CONTROL_WAIT_MS = 3000

function controlled(): Promise<void> {
  return new Promise<void>((done) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true })
    setTimeout(done, CONTROL_WAIT_MS)
  })
}

async function serve(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.register('./sw.js')
  await navigator.serviceWorker.ready
  const had = Boolean(navigator.serviceWorker.controller)
  if (reg.waiting) {
    const taken = controlled()
    reg.waiting.postMessage('skip')
    await taken
    if (had) {
      location.reload()
      await new Promise<never>(() => {})
    }
    return
  }
  if (!had) await controlled()
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
