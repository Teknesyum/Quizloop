import fs from 'node:fs'
import path from 'node:path'
import { Question, type Question as QuestionT } from '../../../src/shared/schema/question.ts'
import { jaccard, trigrams } from '../../../src/shared/text.ts'
import { quoteFound } from './text.ts'
import type { Loaded } from './rules.ts'
import { rangeText, toPdf, type Corpus } from './corpus.ts'
import { assetSource, imageRefs, loadOutputs } from './generate.ts'
import {
  cellCoverage,
  compact,
  findRow,
  labelIndex,
  tableApprovals,
  tableHash,
  tableIndex,
  mentions,
  sameBox,
  type LabelRow,
  type TableRow
} from './etiket.ts'

function ocrFor(rows: TableRow[], q: QuestionT, a: number, b: number): string {
  const captions = [
    q.stem.table?.caption ?? '',
    ...q.solution.map((s) => (s.type === 'table' ? (s.caption ?? '') : ''))
  ].join(' ')
  return rows
    .filter(
      (t) =>
        (t.pdfSayfa >= a - 2 && t.pdfSayfa <= b + 2) ||
        new RegExp(`\\b${t.no.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(captions)
    )
    .map((t) => t.metin)
    .join(' ')
}
export interface Report {
  ok: boolean
  createdAt: string
  units: number
  questions: number
  dropped: number
  errors: { id: string; code: string; message: string }[]
  warnings: { id: string; code: string; message: string }[]
  letters: Record<string, number>
  chi2: number
}

const CHI2_P05_DF4 = 9.488
const TABLE_MIN = 0.85

type Issue = Report['errors'][number]

export function checkVisual(
  q: QuestionT,
  pageText: string,
  labels: LabelRow[],
  approved: Set<string> = new Set()
): { errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = []
  const warnings: Issue[] = []
  if (q.stem.imageRef && !q.stem.alt?.trim())
    errors.push({ id: q.id, code: 'alt', message: `kök görselinde alt yok: ${q.stem.imageRef}` })
  for (const b of q.solution)
    if (b.type === 'image' && !b.alt?.trim())
      errors.push({ id: q.id, code: 'alt', message: `çözüm görselinde alt yok: ${b.ref}` })
  const tables = [
    ...(q.stem.table ? [q.stem.table] : []),
    ...q.solution.flatMap((b) => (b.type === 'table' ? [b] : []))
  ]
  for (const t of tables) {
    const cov = cellCoverage(t, pageText)
    if (cov < TABLE_MIN && approved.has(tableHash(t)))
      warnings.push({
        id: q.id,
        code: 'table-visual',
        message: `hücrelerin %${Math.round(cov * 100)}'i metinde; sayfa görüntüsüyle onaylı`
      })
    else if (cov < TABLE_MIN)
      errors.push({
        id: q.id,
        code: 'table-source',
        message: `hücrelerin %${Math.round(cov * 100)}'i kaynak sayfada (en az %${TABLE_MIN * 100})`
      })
  }
  if (q.stem.masks?.length) {
    const row = q.stem.imageRef ? findRow(labels, q.stem.imageRef) : undefined
    if (!row)
      warnings.push({
        id: q.id,
        code: 'leak-unchecked',
        message: 'maskeli görsel etiket dizininde yok'
      })
    else
      for (const m of q.stem.masks) {
        const e = row.etiketler.find((x) => sameBox(x.kutu, m.box))
        if (e && mentions(q.stem.md, e.metin))
          errors.push({ id: q.id, code: 'leak', message: `kapatılan etiket kökte: "${e.metin}"` })
      }
  }
  if (q.kind === 'isaretleme' && q.correct) {
    const right = q.choices.find((ch) => ch.key === q.correct)
    if (right)
      for (const ch of q.choices)
        if (ch.key !== right.key && compact(ch.md) === compact(right.md))
          errors.push({
            id: q.id,
            code: 'dup-choice',
            message: `doğru şık metni ${ch.key} şıkkında tekrar ediyor: "${right.md}"`
          })
  }
  return { errors, warnings }
}

export function verify(l: Loaded, c: Corpus): Report {
  const outputs = loadOutputs(l)
  const errors: Report['errors'] = []
  const warnings: Report['warnings'] = []
  const all: QuestionT[] = []
  const ids = new Set<string>()
  let dropped = 0
  const [g0, g1] = l.rules.kaynak.govde
  const labels = labelIndex(l)
  const tableOcr = tableIndex(l)
  const approved = tableApprovals(l)
  for (const u of outputs) {
    dropped += u.dropped.length
    for (const raw of u.questions) {
      const v = Question.safeParse(raw)
      const id = raw.id ?? '?'
      if (!v.success) {
        errors.push({
          id,
          code: 'schema',
          message: v.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; ')
        })
        continue
      }
      const q = v.data
      if (ids.has(q.id)) errors.push({ id: q.id, code: 'dup-id', message: 'aynı id iki kez' })
      ids.add(q.id)
      const a = toPdf(l, c, q.source.pages[0])
      const b = toPdf(l, c, q.source.pages[1])
      if (a > b || a < g0 || b > g1)
        errors.push({ id: q.id, code: 'pages', message: `sayfa aralığı gövde dışında: ${a}-${b}` })
      else if (!quoteFound(q.source.quote, rangeText(c, a, b)))
        errors.push({ id: q.id, code: 'quote', message: 'alıntı kaynak sayfalarında yok' })
      for (const ref of imageRefs(q)) {
        if (!fs.existsSync(assetSource(l, ref)))
          errors.push({ id: q.id, code: 'asset', message: ref })
      }
      const vis = checkVisual(
        q,
        rangeText(c, Math.max(1, a - 1), b + 1) + ' ' + ocrFor(tableOcr, q, a, b),
        labels,
        approved
      )
      errors.push(...vis.errors)
      warnings.push(...vis.warnings)
      all.push(q)
    }
  }
  const grams = all.map((q) => trigrams(q.stem.md))
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (jaccard(grams[i]!, grams[j]!) > 0.8)
        warnings.push({ id: all[i]!.id, code: 'near-dup', message: `≈ ${all[j]!.id}` })
    }
  }
  const letters: Record<string, number> = {}
  let sikli = 0
  for (const q of all) {
    if (!q.correct) continue
    sikli++
    letters[q.correct] = (letters[q.correct] ?? 0) + 1
  }
  const k = l.rules.uretim.sikSayisi
  const expected = sikli / k
  let chi2 = 0
  for (const key of ['A', 'B', 'C', 'D', 'E'].slice(0, k))
    chi2 += expected ? ((letters[key] ?? 0) - expected) ** 2 / expected : 0
  if (sikli >= 50 && chi2 > CHI2_P05_DF4)
    warnings.push({
      id: '*',
      code: 'letter-bias',
      message: `χ²=${chi2.toFixed(1)} ${JSON.stringify(letters)}`
    })
  const report: Report = {
    ok: errors.length === 0 && all.length > 0,
    createdAt: new Date().toISOString(),
    units: outputs.length,
    questions: all.length,
    dropped,
    errors,
    warnings,
    letters,
    chi2
  }
  fs.mkdirSync(l.buildDir, { recursive: true })
  fs.writeFileSync(path.join(l.buildDir, 'verify-report.json'), JSON.stringify(report, null, 1))
  return report
}
