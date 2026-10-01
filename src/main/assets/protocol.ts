import { net, protocol } from 'electron'
import { createReadStream, existsSync } from 'node:fs'
import { open, stat } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'

export const SCHEME = 'quizloop'

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true
    }
  }
])

const PDF_HEADERS = {
  'content-type': 'application/pdf',
  'accept-ranges': 'bytes',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'content-length, content-range, accept-ranges'
}

function body(path: string, start: number, end: number): ReadableStream {
  return Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream
}

const MAX_RANGES = 1024
const MAX_BATCH = 64 * 1024 * 1024

async function servePdfRanges(path: string, spec: string): Promise<Response> {
  const size = (await stat(path)).size
  const parts = spec.split(',')
  if (parts.length > MAX_RANGES) return new Response(null, { status: 413 })
  const ranges: [number, number][] = []
  let total = 0
  for (const part of parts) {
    const m = /^(\d+)-(\d+)$/.exec(part)
    if (!m) return new Response(null, { status: 400 })
    const start = Number(m[1])
    const end = Math.min(Number(m[2]), size - 1)
    if (start > end) return new Response(null, { status: 416 })
    total += end - start + 1
    ranges.push([start, end])
  }
  if (total > MAX_BATCH) return new Response(null, { status: 413 })
  const out = Buffer.allocUnsafe(total)
  const fh = await open(path, 'r')
  try {
    let at = 0
    for (const [start, end] of ranges) {
      const len = end - start + 1
      await fh.read(out, at, len, start)
      at += len
    }
  } finally {
    await fh.close()
  }
  return new Response(out, {
    status: 200,
    headers: { ...PDF_HEADERS, 'content-length': String(total) }
  })
}

async function servePdf(path: string, range: string | null): Promise<Response> {
  const size = (await stat(path)).size
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null
  if (!m || (!m[1] && !m[2])) {
    if (size === 0)
      return new Response(null, { status: 200, headers: { ...PDF_HEADERS, 'content-length': '0' } })
    return new Response(body(path, 0, size - 1), {
      status: 200,
      headers: { ...PDF_HEADERS, 'content-length': String(size) }
    })
  }
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]))
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1
  if (start >= size || end < start)
    return new Response(null, {
      status: 416,
      headers: { ...PDF_HEADERS, 'content-range': `bytes */${size}` }
    })
  return new Response(body(path, start, end), {
    status: 206,
    headers: {
      ...PDF_HEADERS,
      'content-length': String(end - start + 1),
      'content-range': `bytes ${start}-${end}/${size}`
    }
  })
}

const ALLOWED = /\.(webp|png|svg|jpg|jpeg)$/i

export function registerAssetProtocol(
  rootOf: (moduleId: string) => string | undefined,
  pdfOf: (moduleId: string) => string | null = () => null
): void {
  protocol.handle(SCHEME, async (req) => {
    const url = new URL(req.url)
    if (url.hostname === 'kaynak') {
      const [, moduleId] = url.pathname.split('/')
      if (!moduleId) return new Response(null, { status: 404 })
      const target = pdfOf(decodeURIComponent(moduleId))
      if (!target) return new Response(null, { status: 404 })
      if (!/\.pdf$/i.test(target)) return new Response(null, { status: 403 })
      if (!existsSync(target)) return new Response(null, { status: 404 })
      const batch = url.searchParams.get('r')
      if (batch) return servePdfRanges(target, batch)
      return servePdf(target, req.headers.get('range'))
    }
    if (url.hostname !== 'module') return new Response(null, { status: 404 })
    const [, moduleId, ...rest] = url.pathname.split('/')
    if (!moduleId || rest[0] !== 'assets') return new Response(null, { status: 404 })
    const root = rootOf(moduleId)
    if (!root) return new Response(null, { status: 404 })
    const target = resolve(join(root, ...rest.map(decodeURIComponent)))
    const base = resolve(root) + sep
    if (!target.startsWith(base) || !ALLOWED.test(target))
      return new Response(null, { status: 403 })
    if (!existsSync(target)) return new Response(null, { status: 404 })
    return net.fetch(pathToFileURL(target).toString())
  })
}

export function assetBase(moduleId: string): string {
  return `${SCHEME}://module/${moduleId}/`
}
