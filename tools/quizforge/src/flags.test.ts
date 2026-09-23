import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Rules, type Loaded } from './rules.ts'
import type { Plan, Unit } from './plan.ts'
import type { Checkpoint } from './checkpoint.ts'
import { applyFlags, consumeFlags, flagNote, planFlags, questionId } from './flags.ts'

let tmp: string
let l: Loaded

const unitA: Unit = {
  unitId: 'b01-p22-24',
  chapter: 1,
  title: 'A',
  pages: [22, 24],
  hash: 'a'.repeat(64),
  chars: 1
}
const unitB: Unit = {
  unitId: 'b02-p25-29',
  chapter: 2,
  title: 'B',
  pages: [25, 29],
  hash: 'b'.repeat(64),
  chars: 1
}
const plan: Plan = { rulesHash: 'r', sourceHash: 's', createdAt: '', units: [unitA, unitB] }

function write(rel: string, data: unknown): void {
  const f = path.join(l.buildDir, rel)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, JSON.stringify(data))
}

function checkpoint(): Checkpoint {
  const st = (u: Unit, ids: string[]): Checkpoint['units'][string] => ({
    unitId: u.unitId,
    hash: u.hash,
    status: 'done' as const,
    attempts: 1,
    questionIds: ids,
    inputTokens: 0,
    outputTokens: 0,
    usd: 0
  })
  return {
    schemaVersion: 1,
    rulesHash: 'r',
    sourceHash: 's',
    units: {
      [unitA.hash]: st(unitA, ['qm-aaa']),
      [unitB.hash]: st(unitB, ['qm-bbb']),
      [unitB.hash + ':gorsel']: st(unitB, ['qm-ggg'])
    },
    totals: { inputTokens: 0, outputTokens: 0, usd: 0 }
  }
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qf-flags-'))
  l = {
    rules: Rules.parse({
      module: { id: 'qm', ad: 'M', surum: '0.1.0' },
      kaynak: { tip: 'pdf', yol: 'x.pdf', kulliyat: 'p', bolumHaritasi: 'c', govde: [1, 99] },
      uretim: {}
    }),
    rulesHash: 'r',
    root: tmp,
    dir: tmp,
    buildDir: path.join(tmp, 'build')
  }
  write('units/b01-p22-24.json', {
    unitId: 'b01-p22-24',
    hash: unitA.hash,
    pages: [22, 24],
    questions: [{ id: 'qm-aaa', stem: { md: 'Kök A' } }],
    dropped: []
  })
  write('units/b02-p25-29-gorsel.json', {
    unitId: 'b02-p25-29-gorsel',
    hash: unitB.hash,
    pages: [25, 29],
    questions: [{ id: 'qm-ggg', stem: { md: 'Görsel kök' } }],
    dropped: []
  })
})

afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('quizforge flags', () => {
  it('computes ids the way toQuestion does', () => {
    expect(questionId(l, unitA, '  Kök  ')).toMatch(/^qm-[0-9a-f]{12}$/)
    expect(questionId(l, unitA, 'Kök')).toBe(questionId(l, unitA, '  Kök  '))
    expect(questionId(l, unitA, 'Kök')).not.toBe(questionId(l, unitB, 'Kök'))
  })

  it('maps ids from unit outputs, raw files and the checkpoint', () => {
    const rawKok = 'Ham dosyadaki kök'
    write('raw/b02-p25-29.json', {
      sorular: [
        {
          alinti: 'x',
          sayfa: { baslangic: 25, bitis: 25 },
          kavram: 'k',
          kok: rawKok,
          cozum: [{ tur: 'text', metin: 'c' }],
          zorluk: 'orta',
          etiketler: []
        }
      ]
    })
    const rawId = questionId(l, unitB, rawKok)
    const fp = planFlags(
      l,
      plan,
      checkpoint(),
      {
        modul: 'qm',
        bayraklar: [
          { soru: 'qm-aaa', not: 'şık C de doğru' },
          { soru: rawId, not: null },
          { soru: 'qm-bbb' },
          { soru: 'qm-ggg' },
          { soru: 'qm-yok' }
        ]
      },
      false
    )
    expect(fp.groups.map((g) => [g.outId, g.items.map((i) => i.soru)])).toEqual([
      ['b01-p22-24', ['qm-aaa']],
      ['b02-p25-29', [rawId, 'qm-bbb']]
    ])
    expect(fp.unmapped).toEqual(['qm-yok'])
    expect(fp.otherLane).toEqual(['qm-ggg'])
  })

  it('refuses a flag file of another module', () => {
    expect(() => planFlags(l, plan, checkpoint(), { modul: 'x', bayraklar: [] }, false)).toThrow()
  })

  it('requeues the unit, leaves a note for the prompt and consumes it after regeneration', () => {
    write('raw/b01-p22-24.json', { sorular: [] })
    const cp = checkpoint()
    const fp = planFlags(
      l,
      plan,
      cp,
      { modul: 'qm', bayraklar: [{ soru: 'qm-aaa', not: 'şık C de doğru' }] },
      false
    )
    applyFlags(l, cp, fp)
    const saved = JSON.parse(
      fs.readFileSync(path.join(l.buildDir, 'checkpoint.json'), 'utf8')
    ) as Checkpoint
    expect(saved.units[unitA.hash]!.status).toBe('failed')
    expect(saved.units[unitB.hash]!.status).toBe('done')
    expect(fs.existsSync(path.join(l.buildDir, 'raw/b01-p22-24.json'))).toBe(false)
    const note = flagNote(l, 'b01-p22-24')
    expect(note).toContain('bozuk bulundu')
    expect(note).toContain('Kök A — şık C de doğru')
    expect(flagNote(l, 'b02-p25-29')).toBe('')
    consumeFlags(l, 'b01-p22-24')
    expect(flagNote(l, 'b01-p22-24')).toBe('')
    expect(fs.existsSync(path.join(l.buildDir, 'bayraklar/islendi/b01-p22-24.json'))).toBe(true)
  })

  it('queues the görsel lane under its own checkpoint key', () => {
    const cp = checkpoint()
    const fp = planFlags(l, plan, cp, { modul: 'qm', bayraklar: [{ soru: 'qm-ggg' }] }, true)
    expect(fp.groups[0]!.key).toBe(unitB.hash + ':gorsel')
    applyFlags(l, cp, fp)
    expect(cp.units[unitB.hash + ':gorsel']!.status).toBe('failed')
    expect(cp.units[unitB.hash]!.status).toBe('done')
    expect(flagNote(l, 'b02-p25-29-gorsel')).toContain('Görsel kök — not düşülmemiş')
  })
})
