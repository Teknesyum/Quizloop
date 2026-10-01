import { useEffect } from 'react'
import {
  getDocument,
  GlobalWorkerOptions,
  PDFDataRangeTransport,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy
} from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

const CHUNK = 1 << 15
const BATCH = 512

export interface Opened {
  key: string
  promise: Promise<PDFDocumentProxy>
  destroy(): void
  doc: PDFDocumentProxy | null
  ratio: number | null
}

let opened: Opened | null = null

export function bookKey(url: string, path: string | null): string {
  return `${url}#${path ?? ''}`
}

function rangeOf(url: string, begin: number, end: number): Promise<Response> {
  return fetch(url, { headers: { Range: `bytes=${begin}-${end - 1}` } })
}

async function load(
  url: string,
  own: { task: PDFDocumentLoadingTask | null }
): Promise<PDFDocumentProxy> {
  const head = await rangeOf(url, 0, CHUNK)
  const total = Number(/\/(\d+)$/.exec(head.headers.get('content-range') ?? '')?.[1] ?? NaN)
  const initial = new Uint8Array(await head.arrayBuffer())
  if (head.status !== 206 || !Number.isFinite(total) || initial.length >= total) {
    own.task = getDocument(head.status === 206 ? { url } : { data: initial })
    return own.task.promise
  }
  const transport = new PDFDataRangeTransport(total, initial)
  const queue: [number, number][] = []
  let busy = false
  const flush = (): void => {
    const batch = queue.splice(0, BATCH)
    if (batch.length === 0) {
      busy = false
      return
    }
    busy = true
    fetch(`${url}?r=${batch.map(([b, e]) => `${b}-${e - 1}`).join(',')}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((buf) => {
        let at = 0
        for (const [b, e] of batch) {
          const len = Math.min(e, total) - b
          transport.onDataRange(b, new Uint8Array(buf.slice(at, at + len)))
          at += len
        }
        flush()
      })
      .catch(() => {
        busy = false
        transport.abort()
      })
  }
  transport.requestDataRange = (begin: number, end: number): void => {
    queue.push([begin, end])
    if (!busy) {
      busy = true
      setTimeout(flush, 0)
    }
  }
  own.task = getDocument({
    range: transport,
    disableAutoFetch: true,
    isImageDecoderSupported: false,
    disableStream: true,
    rangeChunkSize: CHUNK
  })
  return own.task.promise
}

export function openBook(url: string, path: string | null): Opened {
  const key = bookKey(url, path)
  if (opened?.key === key) return opened
  opened?.destroy()
  const own: { task: PDFDocumentLoadingTask | null } = { task: null }
  let dead = false
  const entry: Opened = {
    key,
    promise: Promise.resolve(null as unknown as PDFDocumentProxy),
    destroy: () => {
      dead = true
      void own.task?.destroy()
    },
    doc: null,
    ratio: null
  }
  entry.promise = load(url, own).then(async (d) => {
    if (dead) {
      void own.task?.destroy()
      throw new Error('closed')
    }
    entry.doc = d
    const pg = await d.getPage(1)
    const vp = pg.getViewport({ scale: 1 })
    if (vp.width > 0) entry.ratio = vp.height / vp.width
    return d
  })
  entry.promise.catch(() => {
    if (opened === entry) opened = null
  })
  opened = entry
  return entry
}

export function idle(): Promise<void> {
  return new Promise((r) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => r())
    else requestAnimationFrame(() => r())
  })
}

export function useBookWarmup(moduleId: string | null): void {
  useEffect(() => {
    if (!moduleId) return
    let dead = false
    idle()
      .then(() => (dead ? null : window.quizloop.source.book(moduleId)))
      .then((b) => {
        if (!dead && b?.available && b.url) openBook(b.url, b.path).promise.catch(() => undefined)
      })
      .catch(() => undefined)
    return () => {
      dead = true
    }
  }, [moduleId])
}

export function warmBook(url: string, path: string | null): Opened | null {
  return opened?.key === bookKey(url, path) ? opened : null
}
