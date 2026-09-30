import fs from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type { Box, Mask, Table } from '../../../src/shared/schema/question.ts'
import type { Loaded } from './rules.ts'

export interface LabelRow {
  dosya: string
  pdfSayfa: number
  sekil?: string
  altyazi?: string
  etiketler: { metin: string; kutu: Box }[]
}

export interface TableRow {
  no: string
  pdfSayfa: number
  baslik?: string
  sayfaGorseli: string
  metin: string
}

export interface GenTable {
  baslik?: string
  basliklar: string[]
  satirlar: string[][]
  satirBasligi?: boolean
}

function readJson<T>(file: string): T[] {
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T[]
}

export function labelIndex(l: Loaded): LabelRow[] {
  return readJson<LabelRow>(path.join(l.buildDir, 'etiket', 'index.json'))
}

export function tableHash(t: Table): string {
  return createHash('sha256')
    .update(JSON.stringify({ header: t.header, rows: t.rows }))
    .digest('hex')
}

export function tableApprovals(l: Loaded): Set<string> {
  const file = path.join(l.buildDir, 'tablo', 'onay.json')
  if (!fs.existsSync(file)) return new Set()
  return new Set(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>))
}

export function tableIndex(l: Loaded): TableRow[] {
  return readJson<TableRow>(path.join(l.buildDir, 'tablo', 'index.json'))
}

export function compact(s: string): string {
  return s
    .normalize('NFC')
    .toLocaleLowerCase('tr')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

export function spaced(s: string): string {
  return s
    .normalize('NFC')
    .toLocaleLowerCase('tr')
    .replace(/(\p{L})-\s+(\p{L})/gu, '$1$2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function distance(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++)
      cur.push(
        Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      )
    prev = cur
  }
  return prev[b.length]!
}

export type Match = { ok: true; metin: string; kutu: Box } | { ok: false; reason: string }

export function matchLabel(row: LabelRow, text: string): Match {
  const want = compact(text)
  if (!want) return { ok: false, reason: `boş etiket` }
  const scored = row.etiketler
    .map((e) => ({ e, d: distance(compact(e.metin), want) }))
    .filter((x) => x.d <= Math.floor(want.length / 6))
  if (!scored.length) return { ok: false, reason: `etiket bulunamadı: "${text}" (${row.dosya})` }
  const best = Math.min(...scored.map((x) => x.d))
  const top = scored.filter((x) => x.d === best)
  if (top.length > 1) return { ok: false, reason: `etiket belirsiz: "${text}" (${row.dosya})` }
  return { ok: true, metin: top[0]!.e.metin, kutu: top[0]!.e.kutu }
}

export function findRow(rows: LabelRow[], file: string): LabelRow | undefined {
  const base = path.basename(file)
  return rows.find((r) => r.dosya === base)
}

function within(hay: string, label: string): boolean {
  const w = spaced(label)
  if (!w) return false
  return w.replace(/ /g, '').length <= 2 ? hay.includes(' ' + w + ' ') : hay.includes(' ' + w)
}

export function mentions(stem: string, label: string): boolean {
  return within(' ' + spaced(stem) + ' ', label)
}

export function sameBox(a: Box, b: Box): boolean {
  return a.every((v, i) => Math.abs(v - b[i]!) < 1e-6)
}

export function resolveMasks(
  rows: LabelRow[],
  file: string | undefined,
  masks: string[],
  stem: string
): { ok: true; masks: Mask[] } | { ok: false; reason: string } {
  if (!file) return { ok: false, reason: 'maske var ama gorsel yok' }
  const row = findRow(rows, file)
  if (!row) return { ok: false, reason: `etiket dizininde görsel yok: ${path.basename(file)}` }
  const out: Mask[] = []
  for (const m of masks) {
    const hit = matchLabel(row, m)
    if (!hit.ok) return hit
    if (mentions(stem, hit.metin) || mentions(stem, m))
      return { ok: false, reason: `sızıntı: kapatılan etiket kökte geçiyor: "${hit.metin}"` }
    out.push({ box: hit.kutu })
  }
  return { ok: true, masks: out }
}

export function toTable(t: GenTable): Table {
  const out: Table = {
    header: t.basliklar.map((s) => s.trim()),
    rows: t.satirlar.map((r) => r.map((s) => s.trim()))
  }
  if (t.baslik?.trim()) out.caption = t.baslik.trim()
  if (t.satirBasligi) out.rowHeader = true
  return out
}

export function tableCells(t: Table): string[] {
  return [...t.header, ...t.rows.flat()].filter((s) => spaced(s).length > 0)
}

const GREEK: Record<string, string> = { α: 'a', β: 'b', γ: 'g', δ: 'd', κ: 'k', μ: 'm', σ: 's' }

function loose(s: string): string {
  return spaced(
    s
      .replace(/[¹²³⁰-ⁿ]/g, '')
      .normalize('NFKC')
      .replace(/[×•·]/g, ' ')
      .replace(/[αβγδκμσ]/gi, (g) => GREEK[g.toLocaleLowerCase('tr')] ?? g)
  )
}

export function cellCoverage(t: Table, text: string): number {
  const cells = tableCells(t)
  if (!cells.length) return 1
  const hay = ' ' + loose(text) + ' '
  const tight = hay.replace(/ /g, '')
  const words = new Set(hay.split(' '))
  const found = cells.filter((cell) => {
    const w = loose(cell)
    if (!w) return true
    const parts = w.split(' ')
    if (parts.length >= 4) return parts.filter((p) => words.has(p)).length / parts.length >= 0.8
    if (within(hay, w)) return true
    const c = w.replace(/ /g, '')
    return c.length >= 3 && tight.includes(c)
  }).length
  return found / cells.length
}
