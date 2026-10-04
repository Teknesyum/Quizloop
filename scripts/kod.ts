import { zipSync, type Zippable } from 'fflate'
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { kabuk } from './kabuk'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
const version = process.env['KOD_VERSION'] ?? pkg.version
const files: Zippable = {}

function add(rel: string): void {
  const full = join(root, rel)
  if (statSync(full).isDirectory()) {
    for (const name of readdirSync(full).sort()) add(`${rel}/${name}`)
  } else if (!rel.endsWith('.map')) {
    files[rel] = [new Uint8Array(readFileSync(full)), { mtime: new Date(Date.UTC(2020, 0, 1)) }]
  }
}

for (const part of ['out/main', 'out/preload', 'out/renderer', 'resources']) add(part)
if (!files['out/main/index.js']) throw new Error('out/main/index.js is missing: build first')

const zip = zipSync(files, { level: 9 })
const file = `kod-${version}.zip`
const manifest = {
  version,
  kabuk: kabuk(root),
  file,
  sha512: createHash('sha512').update(zip).digest('hex'),
  size: zip.length
}
const out = join(root, 'dist', 'desktop')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, file), zip)
writeFileSync(join(out, 'kod.json'), JSON.stringify(manifest, null, 2))
console.log(`${file} ${(zip.length / 1024 / 1024).toFixed(2)} MB kabuk ${manifest.kabuk}`)
