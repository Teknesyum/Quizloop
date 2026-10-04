import { net } from 'electron'
import { unzip, type Unzipped } from 'fflate'
import { createHash } from 'node:crypto'
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { kodManifest, safeEntry, type KodManifest } from '@core/kod'
import { kodRoot, writeState } from './kodstate'

const LATEST = 'https://github.com/Teknesyum/Quizloop/releases/latest/download'

function base(): string {
  const local = process.env['QUIZLOOP_KOD_URL'] ?? ''
  return /^http:\/\/127\.0\.0\.1:\d+$/.test(local) ? local : LATEST
}

export async function fetchManifest(): Promise<KodManifest | null> {
  try {
    const res = await net.fetch(`${base()}/kod.json`, { cache: 'no-store' })
    if (!res.ok) return null
    const parsed = kodManifest.safeParse(await res.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function open(data: Uint8Array): Promise<Unzipped> {
  return new Promise((done, fail) => unzip(data, (err, files) => (err ? fail(err) : done(files))))
}

export async function downloadKod(
  manifest: KodManifest,
  onPercent: (percent: number) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await net.fetch(`${base()}/${manifest.file}`, { signal, cache: 'no-store' })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
  const data = new Uint8Array(manifest.size)
  const reader = res.body.getReader()
  let got = 0
  let last = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (got + value.length > manifest.size) throw new Error('size')
    data.set(value, got)
    got += value.length
    const percent = Math.round((got / manifest.size) * 100)
    if (percent !== last) {
      last = percent
      onPercent(percent)
    }
  }
  if (got !== manifest.size) throw new Error('size')
  if (createHash('sha512').update(data).digest('hex') !== manifest.sha512) throw new Error('sha512')

  const files = await open(data)
  if (!files['out/main/index.js']) throw new Error('entry')
  const target = join(kodRoot(), manifest.version)
  const tmp = `${target}.tmp`
  rmSync(tmp, { recursive: true, force: true })
  for (const [name, bytes] of Object.entries(files)) {
    if (name.endsWith('/')) continue
    if (!safeEntry(name)) throw new Error(`entry ${name}`)
    const file = join(tmp, name)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, bytes)
  }
  if (signal.aborted) {
    rmSync(tmp, { recursive: true, force: true })
    throw new Error('aborted')
  }
  rmSync(target, { recursive: true, force: true })
  renameSync(tmp, target)
  writeState({ version: manifest.version, kabuk: manifest.kabuk, tries: 0 })
}
