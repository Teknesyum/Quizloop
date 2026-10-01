import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Question } from '../../../src/shared/schema/question.ts'
import type { Loaded } from './rules.ts'
import {
  benzerCiftler,
  betimleme,
  denetle,
  exportSecenek,
  olc,
  readCikti,
  secenekDir,
  sira,
  uygula,
  type CiktiT
} from './secenek.ts'

let tmp: string
let l: Loaded

const choices = (...md: string[]): { key: string; md: string }[] =>
  md.map((m, i) => ({ key: 'ABCDE'[i]!, md: m }))

function question(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    conceptId: 'k',
    kind: 'coktan-secmeli',
    stem: { md: 'Kürarın etkisi soruluyor.' },
    choices: choices(
      'kısa',
      'orta uzun',
      'Kas gevşemesi sağlayarak derin anestezi gereğini azaltır'
    ),
    correct: 'C',
    distractors: { A: 'a', B: 'b' },
    solution: [{ type: 'text', md: 'Cevap C. Kas gevşemesi sağlar.' }],
    source: { file: 'k.pdf', pages: [1, 1], quote: 'kas gevşemesi sağlayarak derin anestezi' },
    difficulty: 'orta',
    tags: [],
    vurgu: ['Kürarın'],
    contentHash: 'x'.repeat(64),
    deleted: false,
    ...extra
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

function out(rows: CiktiT[]): Map<string, CiktiT> {
  return new Map(rows.map((r) => [r.id, r]))
}

const good: CiktiT = {
  id: 'q1',
  kok: 'Kürar gereken inhalasyon derinliğini nasıl etkiler?',
  siklar: choices(
    'Derinliği azaltır',
    'Derinliği hiç değiştirmez',
    'Derinliği belirgin artırır'
  ) as CiktiT['siklar'],
  dogru: 'A',
  celdiriciler: { B: 'b yeni', C: 'c yeni' },
  degisti: true
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'secenek-'))
  l = { buildDir: tmp } as Loaded
  unit('b01.json', [
    question('q1'),
    question('q2'),
    question('q3', { kind: 'acik-uclu', choices: [], correct: undefined, beklenenCevap: 'x' })
  ])
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('secenek olc', () => {
  it('ranks the correct choice by length', () => {
    expect(sira(choices('aa', 'bbbb', 'c'), 'B')).toBe(1)
    expect(sira(choices('aa', 'bbbb', 'c'), 'C')).toBe(3)
  })

  it('counts longest-correct bias, stems, similar pairs and letters', () => {
    const o = olc([
      { id: 'a', kok: 'X nedir?', siklar: choices('kısa', 'çok çok uzun doğru şık'), dogru: 'B' },
      {
        id: 'b',
        kok: 'Hekimin alanı soruluyor.',
        siklar: choices('uzun bir şık', 'kısa'),
        dogru: 'B'
      },
      {
        id: 'c',
        kok: 'Y hangisidir?',
        siklar: choices('ProSeal LMA ve I-Gel', 'I-Gel ve ProSeal LMA', 'Fastrach'),
        dogru: 'C'
      }
    ])
    expect(o.n).toBe(3)
    expect(o.dogruEnUzun).toBe(1)
    expect(o.belirginEnUzun).toBe(1)
    expect(o.sira).toEqual({ '1': 1, '2': 1, '3': 1 })
    expect(o.soruIsaretiYok).toBe(1)
    expect(o.betimlemeBitis).toBe(1)
    expect(o.benzerCiftliSoru).toBe(1)
    expect(o.harf).toEqual({ B: 2, C: 1 })
  })

  it('detects descriptive stems and near-identical choices', () => {
    expect(betimleme('Uzmanlık alanı ve kullandığı madde soruluyor.')).toBe(true)
    expect(betimleme('Kullandığı madde hangisidir?')).toBe(false)
    expect(benzerCiftler(choices('A ve B', 'B ve A', 'C'))).toHaveLength(1)
  })
})

describe('secenek export', () => {
  it('batches only questions with choices and writes the prompt', () => {
    const files = exportSecenek(l, 1)
    expect(files).toHaveLength(2)
    const item = JSON.parse(fs.readFileSync(files[0]!, 'utf8'))[0]
    expect(item).toMatchObject({
      id: 'q1',
      dogru: 'C',
      kaynak: { sayfa: [1, 1], alinti: 'kas gevşemesi sağlayarak derin anestezi' }
    })
    expect(item.celdiriciler).toEqual({ A: 'a', B: 'b' })
    const istem = fs.readFileSync(path.join(secenekDir(l), 'istem.md'), 'utf8')
    expect(istem).toMatch(/hangisidir\?/)
    expect(istem).toMatch(/en uzun şık olmamalı/)
  })
})

describe('secenek apply', () => {
  it('rewrites stem, choices, key and distractors, keeping the schema valid', () => {
    const r = uygula(l, out([good, { ...good, id: 'q2', degisti: false }]))
    expect(r.hatalar).toEqual([])
    expect(r.degisen).toBe(1)
    expect(r.ayni).toBe(1)
    const u = JSON.parse(fs.readFileSync(path.join(tmp, 'units', 'b01.json'), 'utf8'))
    const q = Question.parse(u.questions[0])
    expect(q.stem.md).toBe(good.kok)
    expect(q.correct).toBe('A')
    expect(q.distractors).toEqual({ B: 'b yeni', C: 'c yeni' })
    expect(q.solution[0]).toMatchObject({ md: 'Cevap A. Kas gevşemesi sağlar.' })
    expect(q.vurgu).toEqual([])
    expect(q.contentHash).not.toBe('x'.repeat(64))
    expect(u.questions[1].stem.md).toBe('Kürarın etkisi soruluyor.')
  })

  it('refuses bad keys, missing distractor notes and unknown ids without writing', () => {
    const bad = {
      ...good,
      siklar: choices('a', 'b', 'c').map((s, i) => ({ ...s, key: 'ABD'[i] })),
      celdiriciler: { B: 'b' }
    } as CiktiT
    const r = uygula(l, out([bad, { ...good, id: 'qx' }]))
    expect(r.hatalar.map((h) => h.mesaj).join(' ')).toMatch(/anahtarlar ABD olmalı ABC/)
    expect(r.hatalar.map((h) => h.mesaj).join(' ')).toMatch(/çeldirici açıklamaları/)
    expect(r.bilinmeyen).toEqual(['qx'])
    const u = JSON.parse(fs.readFileSync(path.join(tmp, 'units', 'b01.json'), 'utf8'))
    expect(u.questions[0].correct).toBe('C')
  })

  it('does not write on dry run and warns when the correct choice is clearly longest', () => {
    const long = {
      ...good,
      siklar: choices('Derinliği azaltır ve kas gevşemesi sağlar', 'Artırır', 'Değişmez')
    } as CiktiT
    const r = uygula(l, out([long]), true)
    expect(r.uyarilar.map((w) => w.kod)).toContain('uzun')
    const u = JSON.parse(fs.readFileSync(path.join(tmp, 'units', 'b01.json'), 'utf8'))
    expect(u.questions[0].correct).toBe('C')
  })

  it('freezes marking questions', () => {
    const q = question('q1', { kind: 'isaretleme' }) as never
    expect(denetle(q, good).hatalar).toContain('sabit şıklar (işaretleme) değiştirilmiş')
  })

  it('reads output files and rejects duplicates', () => {
    const dir = path.join(secenekDir(l), 'out')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, '001.json'), JSON.stringify([good]))
    expect(readCikti(dir).get('q1')?.dogru).toBe('A')
    fs.writeFileSync(path.join(dir, '002.json'), JSON.stringify([good]))
    expect(() => readCikti(dir)).toThrow(/iki kez/)
  })
})
