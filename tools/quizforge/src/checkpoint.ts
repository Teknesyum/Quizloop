import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'

export interface UnitState {
  unitId: string
  hash: string
  status: 'done' | 'failed'
  attempts: number
  questionIds: string[]
  file?: string
  inputTokens: number
  outputTokens: number
  usd: number
  error?: string
}

export interface Checkpoint {
  schemaVersion: 1
  rulesHash: string
  sourceHash: string
  units: Record<string, UnitState>
  totals: { inputTokens: number; outputTokens: number; usd: number }
}

function file(l: Loaded): string {
  return path.join(l.buildDir, 'checkpoint.json')
}

export function loadCheckpoint(l: Loaded, sourceHash: string): Checkpoint {
  const f = file(l)
  if (fs.existsSync(f)) {
    const cp = JSON.parse(fs.readFileSync(f, 'utf8')) as Checkpoint
    if (cp.sourceHash === sourceHash) return cp
  }
  return {
    schemaVersion: 1,
    rulesHash: l.rulesHash,
    sourceHash,
    units: {},
    totals: { inputTokens: 0, outputTokens: 0, usd: 0 }
  }
}

export function saveCheckpoint(l: Loaded, cp: Checkpoint): void {
  fs.mkdirSync(l.buildDir, { recursive: true })
  const f = file(l)
  fs.writeFileSync(f + '.tmp', JSON.stringify(cp, null, 1))
  fs.renameSync(f + '.tmp', f)
}

export function writeAtomic(target: string, data: string): void {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target + '.partial', data)
  fs.renameSync(target + '.partial', target)
}

export function cleanPartials(dir: string): void {
  if (!fs.existsSync(dir)) return
  for (const n of fs.readdirSync(dir)) if (n.endsWith('.partial')) fs.unlinkSync(path.join(dir, n))
}
