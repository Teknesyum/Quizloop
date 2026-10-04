import { t } from '@renderer/i18n'
import { installPdfWorker } from '../android/pdfworker'
import { createShell } from './shell'

const CONTROL_WAIT_MS = 3000

async function serve(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  await navigator.serviceWorker.register('./sw.js')
  await navigator.serviceWorker.ready
  if (navigator.serviceWorker.controller) return
  await new Promise<void>((done) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true })
    setTimeout(done, CONTROL_WAIT_MS)
  })
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
