import { GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import polyfillUrl from './polyfill.js?url&no-inline'
import './polyfill.js'

export function installPdfWorker(): void {
  const abs = (u: string): string => new URL(u, location.href).href
  const entry = `import ${JSON.stringify(abs(polyfillUrl))};\nimport ${JSON.stringify(abs(workerUrl))};\n`
  const url = URL.createObjectURL(new Blob([entry], { type: 'text/javascript' }))
  GlobalWorkerOptions.workerPort = new Worker(url, { type: 'module' })
}
