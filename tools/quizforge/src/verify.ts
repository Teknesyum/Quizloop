import fs from 'node:fs'
import path from 'node:path'
import { Question, type Question as QuestionT } from '../../../src/shared/schema/question.ts'
import { jaccard, trigrams } from '../../../src/shared/text.ts'
import { quoteFound } from './text.ts'
import type { Loaded } from './rules.ts'
import { rangeText, toPdf, type Corpus } from './corpus.ts'
import { loadOutputs } from './generate.ts'

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

export function verify(l: Loaded, c: Corpus): Report {
  const outputs = loadOutputs(l)
  const errors: Report['errors'] = []
  const warnings: Report['warnings'] = []
  const all: QuestionT[] = []
  const ids = new Set<string>()
  let dropped = 0
  const [g0, g1] = l.rules.kaynak.govde
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
      for (const ch of q.choices) {
        if (ch.imageRef && !fs.existsSync(path.join(l.dir, ch.imageRef)))
          errors.push({ id: q.id, code: 'asset', message: ch.imageRef })
      }
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
  for (const q of all) letters[q.correct] = (letters[q.correct] ?? 0) + 1
  const k = l.rules.uretim.sikSayisi
  const expected = all.length / k
  let chi2 = 0
  for (const key of ['A', 'B', 'C', 'D', 'E'].slice(0, k))
    chi2 += expected ? ((letters[key] ?? 0) - expected) ** 2 / expected : 0
  if (all.length >= 50 && chi2 > CHI2_P05_DF4)
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
