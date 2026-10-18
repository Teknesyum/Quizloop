import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'
import type { SourceBook } from '@shared/ipc'
import { bookKey, bookTarget, load, loadWhole, warmBook } from './bookdoc'

export interface Region {
  pdfSayfa: number
  bbox: [number, number, number, number]
}

const TARGET = 1400
const MAX_SCALE = 4
const MAX_PX = 1 << 24
const DOCS = 2
const IMAGES = 48

interface Held {
  promise: Promise<PDFDocumentProxy>
  own: { task: PDFDocumentLoadingTask | null }
}

const docs = new Map<string, Held>()
const images = new Map<string, Promise<string>>()

function docFor(url: string, path: string | null, whole: boolean): Promise<PDFDocumentProxy> {
  const key = bookKey(url, path)
  const warm = warmBook(url, path)
  if (warm) return warm.promise
  const hit = docs.get(key)
  if (hit) {
    docs.delete(key)
    docs.set(key, hit)
    return hit.promise
  }
  const own: { task: PDFDocumentLoadingTask | null } = { task: null }
  const held: Held = { own, promise: whole ? loadWhole(url, own) : load(url, own) }
  held.promise.catch(() => {
    if (docs.get(key) === held) docs.delete(key)
  })
  docs.set(key, held)
  while (docs.size > DOCS) {
    const [old, entry] = docs.entries().next().value as [string, Held]
    docs.delete(old)
    void entry.own.task?.destroy()
  }
  return held.promise
}

export function regionScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1
  const fit = Math.min(MAX_SCALE, Math.max(1, TARGET / width))
  return Math.min(fit, Math.sqrt(MAX_PX / (width * height)))
}

async function draw(doc: PDFDocumentProxy, page: number, bbox: Region['bbox']): Promise<string> {
  const pg = await doc.getPage(page)
  const [x0, y0, x1, y1] = bbox
  const scale = regionScale(x1 - x0, y1 - y0)
  const viewport = pg.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round((x1 - x0) * scale))
  canvas.height = Math.max(1, Math.round((y1 - y0) * scale))
  await pg.render({ canvas, viewport, transform: [1, 0, 0, 1, -x0 * scale, -y0 * scale] }).promise
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9))
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('encode')
  return URL.createObjectURL(blob)
}

export function regionUrl(book: SourceBook | null, region: Region): Promise<string> | null {
  const target = bookTarget(book, region.pdfSayfa)
  if (!target) return null
  const key = `${bookKey(target.url, target.path)}@${region.pdfSayfa}:${region.bbox.join(',')}`
  const hit = images.get(key)
  if (hit) {
    images.delete(key)
    images.set(key, hit)
    return hit
  }
  const made = docFor(target.url, target.path, target.whole).then((d) =>
    draw(d, region.pdfSayfa - target.base, region.bbox)
  )
  made.catch(() => {
    if (images.get(key) === made) images.delete(key)
  })
  images.set(key, made)
  while (images.size > IMAGES) {
    const [old, p] = images.entries().next().value as [string, Promise<string>]
    images.delete(old)
    p.then((u) => URL.revokeObjectURL(u)).catch(() => undefined)
  }
  return made
}
