import fs from 'node:fs'
import path from 'node:path'
import { ModuleMeta } from '../../../src/shared/schema/module.ts'
import { Block, type Question as QuestionT } from '../../../src/shared/schema/question.ts'
import type { Loaded } from './rules.ts'
import { toPdf, type Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import { figuresDir, moduleDir, tablesDir, unitsDir, type UnitOutput } from './generate.ts'
import { loadCheckpoint, saveCheckpoint, writeAtomic } from './checkpoint.ts'
import { cpKey, suffix, type Tur } from './tur.ts'

export const MODUL_UNIT = '_modul'

export interface GeriResult {
  questions: number
  units: number
  unplaced: number
  images: number
  tables: number
}

export function readModule(dir: string): QuestionT[] {
  const meta = ModuleMeta.parse(JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8')))
  return meta.blocks.flatMap(
    (b) => Block.parse(JSON.parse(fs.readFileSync(path.join(dir, b.file), 'utf8'))).questions
  )
}

function copyDir(from: string, to: string): number {
  if (!fs.existsSync(from)) return 0
  fs.mkdirSync(to, { recursive: true })
  let n = 0
  for (const name of fs.readdirSync(from)) {
    const src = path.join(from, name)
    if (!fs.statSync(src).isFile()) continue
    fs.copyFileSync(src, path.join(to, name))
    n++
  }
  return n
}

export function laneOf(q: QuestionT): Tur {
  return q.stem.imageRef ? 'gorsel' : 'metin'
}

export function geriAl(
  l: Loaded,
  c: Corpus,
  plan: Plan,
  opts: { force?: boolean; dir?: string } = {}
): GeriResult {
  const dir = opts.dir ?? moduleDir(l)
  if (!fs.existsSync(path.join(dir, 'module.json'))) throw new Error('modül yok: ' + dir)
  const out = unitsDir(l)
  const existing = fs.existsSync(out) ? fs.readdirSync(out).filter((n) => n.endsWith('.json')) : []
  if (existing.length && !opts.force)
    throw new Error(`build/units boş değil (${existing.length} dosya); üzerine yazmak için --force`)
  const questions = readModule(dir)
  const groups = new Map<string, { unit: Unit | null; tur: Tur; questions: QuestionT[] }>()
  const pdfPages: number[] = []
  for (const q of questions) {
    const p = toPdf(l, c, q.source.pages[0])
    pdfPages.push(p)
    const unit = plan.units.find((u) => p >= u.pages[0] && p <= u.pages[1]) ?? null
    const tur = laneOf(q)
    const key = unit ? unit.unitId + suffix(tur) : MODUL_UNIT
    const g = groups.get(key) ?? { unit, tur, questions: [] }
    g.questions.push(q)
    groups.set(key, g)
  }
  const cp = loadCheckpoint(l, c.sha256)
  let unplaced = 0
  for (const [outId, g] of groups) {
    const target = path.join(out, outId + '.json')
    const pages: [number, number] = g.unit
      ? g.unit.pages
      : [Math.min(...pdfPages), Math.max(...pdfPages)]
    const unitOut: UnitOutput = {
      unitId: outId,
      hash: g.unit ? g.unit.hash : MODUL_UNIT,
      pages,
      questions: g.questions,
      dropped: []
    }
    writeAtomic(target, JSON.stringify(unitOut, null, 1))
    if (!g.unit) {
      unplaced = g.questions.length
      continue
    }
    const key = cpKey(g.unit.hash, g.tur)
    const prev = cp.units[key]
    if (prev?.status === 'done' && !opts.force) continue
    cp.units[key] = {
      unitId: outId,
      hash: g.unit.hash,
      status: 'done',
      attempts: prev?.attempts ?? 0,
      questionIds: g.questions.map((q) => q.id),
      file: path.relative(l.buildDir, target),
      inputTokens: prev?.inputTokens ?? 0,
      outputTokens: prev?.outputTokens ?? 0,
      usd: prev?.usd ?? 0
    }
  }
  saveCheckpoint(l, cp)
  const images = copyDir(path.join(dir, 'assets', 'img'), figuresDir(l))
  const tables = copyDir(path.join(dir, 'assets', 'tbl'), tablesDir(l))
  return {
    questions: questions.length,
    units: [...groups.keys()].filter((k) => k !== MODUL_UNIT).length,
    unplaced,
    images,
    tables
  }
}
