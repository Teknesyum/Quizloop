import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'
import type { Corpus } from './corpus.ts'
import type { Plan } from './plan.ts'
import { Generated, mapUnit, unitsDir, type UnitOutput } from './generate.ts'
import { loadCheckpoint, saveCheckpoint, writeAtomic } from './checkpoint.ts'
import { rawDir } from './brief.ts'

export interface IngestResult {
  unitId: string
  questions: number
  dropped: number
  error?: string
}

export function ingest(l: Loaded, c: Corpus, plan: Plan): IngestResult[] {
  const dir = rawDir(l)
  const cp = loadCheckpoint(l, c.sha256)
  const out: IngestResult[] = []
  if (!fs.existsSync(dir)) return out
  for (const unit of plan.units) {
    const file = path.join(dir, unit.unitId + '.json')
    if (!fs.existsSync(file)) continue
    const state = cp.units[unit.hash] ?? {
      unitId: unit.unitId,
      hash: unit.hash,
      status: 'failed' as const,
      attempts: 0,
      questionIds: [],
      inputTokens: 0,
      outputTokens: 0,
      usd: 0
    }
    state.attempts++
    const parsed = Generated.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')))
    if (!parsed.success) {
      state.status = 'failed'
      state.error = parsed.error.issues
        .slice(0, 3)
        .map((i) => i.path.join('.') + ': ' + i.message)
        .join('; ')
      cp.units[unit.hash] = state
      out.push({ unitId: unit.unitId, questions: 0, dropped: 0, error: state.error })
      continue
    }
    const mapped = mapUnit(l, c, unit, parsed.data)
    const unitOut: UnitOutput = {
      unitId: unit.unitId,
      hash: unit.hash,
      pages: unit.pages,
      questions: mapped.questions,
      dropped: mapped.dropped
    }
    const target = path.join(unitsDir(l), unit.unitId + '.json')
    writeAtomic(target, JSON.stringify(unitOut, null, 1))
    state.status = 'done'
    state.file = path.relative(l.buildDir, target)
    state.questionIds = mapped.questions.map((q) => q.id)
    delete state.error
    cp.units[unit.hash] = state
    out.push({ unitId: unit.unitId, questions: mapped.questions.length, dropped: mapped.dropped.length })
  }
  saveCheckpoint(l, cp)
  return out
}
