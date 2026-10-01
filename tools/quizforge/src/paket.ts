import fs from 'node:fs'
import path from 'node:path'
import { zipSync, type Zippable } from 'fflate'
import { ModuleMeta } from '../../../src/shared/schema/module.ts'
import type { Loaded } from './rules.ts'
import { moduleDir } from './generate.ts'

const SIKISMIS = /\.(webp|png|jpe?g|gif|avif|pdf)$/i

function walk(dir: string, rel = ''): string[] {
  const out: string[] = []
  for (const d of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${d.name}` : d.name
    if (d.isDirectory()) {
      if (!rel && d.name === 'build') continue
      out.push(...walk(dir, r))
    } else out.push(r)
  }
  return out
}

function kitapYolu(l: Loaded): string | null {
  const k = l.rules.kaynak
  if (k.tip !== 'pdf') return null
  const p = path.resolve(l.root, k.yol)
  return fs.existsSync(p) ? p : null
}

export function paket(l: Loaded): { out: string; files: number; bytes: number } {
  const dir = moduleDir(l)
  const metaFile = path.join(dir, 'module.json')
  if (!fs.existsSync(metaFile)) throw new Error(`modül yok: ${dir} (önce pack)`)
  const meta = ModuleMeta.parse(JSON.parse(fs.readFileSync(metaFile, 'utf8')))
  const tags = l.rules.module.etiketler.map((t) => t.toLocaleLowerCase('tr'))
  const next = ModuleMeta.parse({ ...meta, version: l.rules.module.surum, tags })
  fs.writeFileSync(metaFile, JSON.stringify(next, null, 1))
  const files = walk(dir)
  const entries: Zippable = {}
  for (const f of files) {
    const data = fs.readFileSync(path.join(dir, f))
    entries[f] = [data, { level: SIKISMIS.test(f) ? 0 : 6 }]
  }
  const kitap = kitapYolu(l)
  if (kitap) entries[`kaynak/${path.basename(kitap)}`] = [fs.readFileSync(kitap), { level: 0 }]
  const zip = zipSync(entries)
  const outDir = path.join(l.root, 'dist-modules')
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, `${next.id}-${next.version}.qlmod`)
  fs.writeFileSync(out, zip)
  return { out, files: files.length + (kitap ? 1 : 0), bytes: zip.length }
}
