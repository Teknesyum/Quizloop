import { createHash } from 'node:crypto'
import { createWriteStream, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { CatalogPackage } from '@core/commands/catalogs'
import { catalogAddress } from '@shared/catalog'
import { PACKAGE_EXT } from './paket'

const TEXT_LIMIT = 1_048_576
const TEXT_MS = 20_000
const PACKAGE_MS = 900_000

export class CatalogHashError extends Error {}

export interface Downloaded {
  file: string
  cleanup(): void
}

async function get(url: string, ms: number): Promise<Response> {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(ms) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  if (!catalogAddress(r.url)) throw new Error(`güvensiz yönlendirme: ${r.url}`)
  return r
}

export async function catalogText(url: string): Promise<string> {
  const text = await (await get(url, TEXT_MS)).text()
  if (text.length > TEXT_LIMIT) throw new Error('katalog dosyası çok büyük')
  return text
}

export async function catalogDownload(pkg: CatalogPackage, base = tmpdir()): Promise<Downloaded> {
  const dir = mkdtempSync(join(base, 'quizloop-kanal-'))
  const cleanup = (): void => rmSync(dir, { recursive: true, force: true })
  try {
    const r = await get(pkg.url, PACKAGE_MS)
    if (!r.body) throw new Error('boş yanıt')
    const file = join(dir, `${pkg.id}.${PACKAGE_EXT}`)
    const hash = createHash('sha256')
    let size = 0
    const meter = new Transform({
      transform(chunk: Buffer, _enc, done) {
        size += chunk.length
        if (size > pkg.size) return done(new CatalogHashError('paket bildirilenden büyük'))
        hash.update(chunk)
        done(null, chunk)
      }
    })
    await pipeline(Readable.fromWeb(r.body as never), meter, createWriteStream(file))
    if (size !== pkg.size || hash.digest('hex') !== pkg.sha256)
      throw new CatalogHashError('paket özeti tutmuyor')
    return { file, cleanup }
  } catch (e) {
    cleanup()
    throw e
  }
}
