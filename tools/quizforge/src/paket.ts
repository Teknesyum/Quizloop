import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { zipSync, type Zippable } from 'fflate'
import { ModuleMeta, type BookPart } from '../../../src/shared/schema/module.ts'
import type { Loaded } from './rules.ts'
import { moduleDir } from './generate.ts'

const SIKISMIS = /\.(webp|png|jpe?g|gif|avif|pdf)$/i
const ESIK = 1.2

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

function calisir(bin: string): boolean {
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8' })
  return r.status === 0
}

export function qpdfYolu(): string | null {
  const env = process.env['QPDF']
  if (env && calisir(env)) return env
  if (calisir('qpdf')) return 'qpdf'
  if (process.platform !== 'win32') return null
  for (const base of [process.env['ProgramFiles'], process.env['LOCALAPPDATA']]) {
    if (!base || !fs.existsSync(base)) continue
    const dirs = fs
      .readdirSync(base)
      .filter((d) => /^qpdf/i.test(d))
      .sort()
      .reverse()
    for (const d of dirs) {
      const exe = path.join(base, d, 'bin', 'qpdf.exe')
      if (fs.existsSync(exe)) return exe
    }
  }
  return null
}

interface Harita {
  chapters: { chapter: number; pdfPages: [number, number] }[]
}

export interface Bolumleme {
  parcalar: BookPart[]
  dosyalar: Map<string, string>
  toplam: number
  kitap: number
  nesneAkisi: boolean
}

function bol(qpdf: string, kitap: string, harita: Harita, dir: string, akis: boolean): Bolumleme {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const parcalar: BookPart[] = []
  const dosyalar = new Map<string, string>()
  let toplam = 0
  const genislik = Math.max(2, ...harita.chapters.map((c) => String(c.chapter).length))
  for (const c of harita.chapters) {
    const [ilk, son] = c.pdfPages
    const ad = `${String(c.chapter).padStart(genislik, '0')}.pdf`
    const out = path.join(dir, ad)
    const args = ['--empty', '--pages', kitap, `${ilk}-${son}`, '--']
    if (akis) args.splice(1, 0, '--object-streams=generate')
    const r = spawnSync(qpdf, [...args, out], { encoding: 'utf8' })
    if (r.status !== 0 && r.status !== 3) {
      throw new Error(`qpdf bölüm ${c.chapter}: ${(r.stderr || r.error?.message || '').trim()}`)
    }
    const dosya = `kaynak/bolum/${ad}`
    parcalar.push({ bolum: c.chapter, ilkSayfa: ilk, sonSayfa: son, dosya })
    dosyalar.set(dosya, out)
    toplam += fs.statSync(out).size
  }
  return { parcalar, dosyalar, toplam, kitap: fs.statSync(kitap).size, nesneAkisi: akis }
}

export function bolumle(l: Loaded): Bolumleme {
  const kitap = kitapYolu(l)
  if (!kitap) throw new Error(`kitap PDF'i yok: ${l.rules.kaynak.yol}`)
  const qpdf = qpdfYolu()
  if (!qpdf) {
    throw new Error(
      'qpdf yok. Windows: winget install --id QPDF.QPDF -e · macOS: brew install qpdf · Linux: apt install qpdf · ya da QPDF=<yol>'
    )
  }
  const harita = JSON.parse(
    fs.readFileSync(path.resolve(l.root, l.rules.kaynak.bolumHaritasi), 'utf8')
  ) as Harita
  const atla = new Set(l.rules.kaynak.atlanacakBolumler)
  const secili = { chapters: harita.chapters.filter((c) => !atla.has(c.chapter)) }
  const dir = path.join(l.buildDir, 'bolum')
  const ilk = bol(qpdf, kitap, secili, dir, false)
  if (ilk.toplam <= ilk.kitap * ESIK) return ilk
  const ikinci = bol(qpdf, kitap, secili, dir, true)
  return ikinci.toplam < ilk.toplam ? ikinci : bol(qpdf, kitap, secili, dir, false)
}

export interface PaketSonucu {
  out: string
  files: number
  bytes: number
  bolum?: Bolumleme
}

export function paket(l: Loaded, opts: { android?: boolean } = {}): PaketSonucu {
  const dir = moduleDir(l)
  const metaFile = path.join(dir, 'module.json')
  if (!fs.existsSync(metaFile)) throw new Error(`modül yok: ${dir} (önce pack)`)
  const meta = ModuleMeta.parse(JSON.parse(fs.readFileSync(metaFile, 'utf8')))
  const tags = l.rules.module.etiketler.map((t) => t.toLocaleLowerCase('tr'))
  const next = ModuleMeta.parse({ ...meta, version: l.rules.module.surum, tags })
  const kaynak = next.source ? { ...next.source } : undefined
  if (kaynak) delete kaynak.bolumler
  const disk = { ...next, source: kaynak }
  fs.writeFileSync(metaFile, JSON.stringify(disk, null, 1))
  const files = walk(dir)
  const entries: Zippable = {}
  for (const f of files) {
    const data = fs.readFileSync(path.join(dir, f))
    entries[f] = [data, { level: SIKISMIS.test(f) ? 0 : 6 }]
  }
  const outDir = path.join(l.root, 'dist-modules')
  fs.mkdirSync(outDir, { recursive: true })
  if (opts.android) {
    const b = bolumle(l)
    for (const [dosya, yol] of b.dosyalar) entries[dosya] = [fs.readFileSync(yol), { level: 0 }]
    const src = {
      ...(kaynak ?? { title: next.name, sayfaOfseti: l.rules.kaynak.sayfaOfseti }),
      bolumler: b.parcalar
    }
    const meta2 = ModuleMeta.parse({ ...disk, source: src })
    entries['module.json'] = [Buffer.from(JSON.stringify(meta2, null, 1)), { level: 6 }]
    const zip = zipSync(entries)
    const out = path.join(outDir, `${next.id}-${next.version}-android.qlmod`)
    fs.writeFileSync(out, zip)
    return { out, files: files.length + b.dosyalar.size, bytes: zip.length, bolum: b }
  }
  const kitap = kitapYolu(l)
  if (kitap) entries[`kaynak/${path.basename(kitap)}`] = [fs.readFileSync(kitap), { level: 0 }]
  const zip = zipSync(entries)
  const out = path.join(outDir, `${next.id}-${next.version}.qlmod`)
  fs.writeFileSync(out, zip)
  return { out, files: files.length + (kitap ? 1 : 0), bytes: zip.length }
}
