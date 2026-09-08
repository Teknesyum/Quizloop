import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'
import { bodyText, unitText, type Corpus } from './corpus.ts'
import { sha256 } from './hash.ts'

export interface Unit {
  unitId: string
  chapter: number
  title: string
  pages: [number, number]
  hash: string
  chars: number
}

export interface Plan {
  rulesHash: string
  sourceHash: string
  createdAt: string
  units: Unit[]
}

const CAPS = /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s\-,/()&']{5,60}$/

export function isHeading(line: string): boolean {
  const s = line.trim()
  if (!CAPS.test(s) || s.endsWith('.')) return false
  const words = s.split(/\s+/)
  return words.length <= 8 && s.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length >= 6
}

function allowed(l: Loaded, page: number): boolean {
  const k = l.rules.kaynak
  if (page < k.govde[0] || page > k.govde[1]) return false
  return !k.atlanacakSayfalar.some(([a, b]) => page >= a && page <= b)
}

function segments(l: Loaded, c: Corpus, pages: number[]): number[][] {
  const [min, max] = l.rules.uretim.parcaSayfaAraligi
  const fixed = l.rules.uretim.parcaBirimi === 'sabit'
  const segs: number[][] = []
  let cur: number[] = []
  for (const pg of pages) {
    const p = c.pages.get(pg)
    const starts =
      !fixed && p !== undefined && cur.length > 0 && bodyText(p).split('\n').some(isHeading)
    if (starts) {
      segs.push(cur)
      cur = []
    }
    cur.push(pg)
  }
  if (cur.length) segs.push(cur)
  const merged: number[][] = []
  for (const s of segs) {
    const last = merged[merged.length - 1]
    if (last && last.length < min) last.push(...s)
    else merged.push([...s])
  }
  const tail = merged[merged.length - 1]
  if (merged.length > 1 && tail && tail.length < min) {
    merged.pop()
    merged[merged.length - 1]!.push(...tail)
  }
  const out: number[][] = []
  for (const s of merged) {
    if (s.length <= max) {
      out.push(s)
      continue
    }
    const n = Math.ceil(s.length / max)
    const size = Math.ceil(s.length / n)
    for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size))
  }
  return out
}

export function buildPlan(l: Loaded, c: Corpus): Plan {
  const units: Unit[] = []
  for (const ch of c.chapters) {
    if (l.rules.kaynak.atlanacakBolumler.includes(ch.chapter)) continue
    const pages: number[] = []
    for (let p = ch.pdfPages[0]; p <= ch.pdfPages[1]; p++)
      if (allowed(l, p) && c.pages.has(p)) pages.push(p)
    if (!pages.length) continue
    for (const seg of segments(l, c, pages)) {
      const a = seg[0]!
      const b = seg[seg.length - 1]!
      const text = unitText(l, c, a, b)
      units.push({
        unitId: `b${String(ch.chapter).padStart(2, '0')}-p${a}-${b}`,
        chapter: ch.chapter,
        title: ch.title,
        pages: [a, b],
        hash: sha256(l.rulesHash + '\n' + text),
        chars: text.length
      })
    }
  }
  return {
    rulesHash: l.rulesHash,
    sourceHash: c.sha256,
    createdAt: new Date().toISOString(),
    units
  }
}

export function planFile(l: Loaded): string {
  return path.join(l.buildDir, 'plan.json')
}

export function savePlan(l: Loaded, plan: Plan): void {
  fs.mkdirSync(l.buildDir, { recursive: true })
  fs.writeFileSync(planFile(l), JSON.stringify(plan, null, 1))
}

export function loadPlan(l: Loaded): Plan {
  const f = planFile(l)
  if (!fs.existsSync(f)) throw new Error('plan yok, önce `quizforge plan` çalıştır: ' + f)
  const plan = JSON.parse(fs.readFileSync(f, 'utf8')) as Plan
  if (plan.rulesHash !== l.rulesHash) throw new Error('rules.yaml değişti, planı yeniden üret')
  return plan
}
