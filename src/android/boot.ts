import { t } from '@renderer/i18n'
import { installPdfWorker } from './pdfworker'
import { createShell } from './shell'

installPdfWorker()

createShell()
  .then((api) => {
    window.quizloop = api
    return import('@renderer/main')
  })
  .catch((e: unknown) => {
    const box = document.getElementById('root') ?? document.body
    box.textContent = `${t('android.bootFailed')} ${String(e)}`
    console.error('[quizloop] boot failed', e)
  })
