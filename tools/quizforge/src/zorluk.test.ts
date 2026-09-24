import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Loaded } from './rules.ts'
import {
  OLCUTLER,
  agreement,
  applyLabels,
  exportBatches,
  readLabels,
  toItem,
  zorlukDir,
  type LabelT
} from './zorluk.ts'

let tmp: string
let l: Loaded

function question(id: string, difficulty: string, open = false): Record<string, unknown> {
  return {
    id,
    kind: open ? 'acik-uclu' : 'coktan-secmeli',
    stem: { md: 'Kök ' + id },
    choices: open
      ? []
      : [
          { key: 'A', md: 'bir' },
          { key: 'B', md: 'iki' }
        ],
    correct: open ? undefined : 'A',
    beklenenCevap: open ? 'cevap' : undefined,
    difficulty,
    source: { file: 'k.pdf', pages: [1, 1], quote: 'alıntı ' + id }
  }
}

function unit(file: string, questions: Record<string, unknown>[]): void {
  const f = path.join(l.buildDir, 'units', file)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(
    f,
    JSON.stringify({ unitId: 'u', hash: 'h', pages: [1, 1], questions, dropped: [] })
  )
}

function labels(rows: LabelT[]): Map<string, LabelT> {
  return new Map(rows.map((r) => [r.id, r]))
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zorluk-'))
  l = { buildDir: tmp } as Loaded
  unit('b01.json', [question('q1', 'kolay'), question('q2', 'orta')])
  unit('b01-gorsel.json', [question('q3', 'zor', true)])
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('zorluk', () => {
  it('maps every criterion to one level', () => {
    expect(new Set(Object.values(OLCUTLER))).toEqual(new Set(['kolay', 'orta', 'zor']))
  })

  it('exports choices for multiple choice and the expected answer for open questions', () => {
    const q = question('q9', 'orta', true) as never
    expect(toItem(q)).toMatchObject({ id: 'q9', beklenenCevap: 'cevap' })
    expect(toItem(question('q8', 'kolay') as never).siklar).toEqual(['A) bir', 'B) iki'])
    const files = exportBatches(l, 2)
    expect(files).toHaveLength(2)
    expect(fs.existsSync(path.join(zorlukDir(l), 'istem.md'))).toBe(true)
  })

  it('rejects a criterion that disagrees with its level', () => {
    const out = path.join(zorlukDir(l), 'out')
    fs.mkdirSync(out, { recursive: true })
    fs.writeFileSync(
      path.join(out, '001.json'),
      JSON.stringify([{ id: 'q1', zorluk: 'zor', olcut: 'K1' }])
    )
    expect(() => readLabels(out)).toThrow(/uyuşmuyor/)
  })

  it('writes new levels back into every unit file, including suffixed ones', () => {
    const r = applyLabels(
      l,
      labels([
        { id: 'q1', zorluk: 'orta', olcut: 'O1' },
        { id: 'q2', zorluk: 'orta', olcut: 'O2' },
        { id: 'q3', zorluk: 'kolay', olcut: 'K1' }
      ])
    )
    expect(r.changed).toBe(2)
    expect(r.matrix.zor.kolay).toBe(1)
    const g = JSON.parse(fs.readFileSync(path.join(tmp, 'units', 'b01-gorsel.json'), 'utf8'))
    expect(g.questions[0].difficulty).toBe('kolay')
  })

  it('writes nothing when a question has no label', () => {
    const r = applyLabels(l, labels([{ id: 'q1', zorluk: 'zor', olcut: 'Z1' }]))
    expect([...r.missing].sort()).toEqual(['q2', 'q3'])
    const u = JSON.parse(fs.readFileSync(path.join(tmp, 'units', 'b01.json'), 'utf8'))
    expect(u.questions[0].difficulty).toBe('kolay')
  })

  it('counts agreement by level distance', () => {
    const a = labels([
      { id: 'q1', zorluk: 'kolay', olcut: 'K1' },
      { id: 'q2', zorluk: 'orta', olcut: 'O1' },
      { id: 'q3', zorluk: 'kolay', olcut: 'K1' }
    ])
    const b = labels([
      { id: 'q1', zorluk: 'kolay', olcut: 'K1' },
      { id: 'q2', zorluk: 'zor', olcut: 'Z2' },
      { id: 'q3', zorluk: 'zor', olcut: 'Z1' },
      { id: 'qx', zorluk: 'zor', olcut: 'Z1' }
    ])
    expect(agreement(a, b)).toEqual({ n: 3, same: 1, adjacent: 1, far: 1 })
  })
})
