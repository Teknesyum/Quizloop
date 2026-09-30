import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Rules, type Loaded } from './rules.ts'
import type { Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import { Generated, mapUnit, unitsDir, type UnitOutput } from './generate.ts'
import { cellCoverage, matchLabel, mentions, tableHash, toTable, type LabelRow } from './etiket.ts'
import { checkVisual, verify } from './verify.ts'
import { pack } from './pack.ts'
import { geriAl } from './geri.ts'
import { loadCheckpoint } from './checkpoint.ts'
import type { Question } from '../../../src/shared/schema/question.ts'

let tmp: string
let l: Loaded

const TEXT =
  'Anestezi makinesinde APL valvi devredeki basıncı sınırlar ve fazla gazı atık sistemine verir. ' +
  'Tablo 3-3 İndüksiyon dozları: İlaç Doz Propofol 1-2,5 mg/kg Etomidat 0,2-0,5 mg/kg Ketamin 1-2 mg/kg.'

const unit: Unit = {
  unitId: 'b01-p5-7',
  chapter: 1,
  title: 'Makine',
  pages: [5, 7],
  hash: 'c'.repeat(64),
  chars: TEXT.length
}

const plan: Plan = { rulesHash: 'r', sourceHash: 's', createdAt: '', units: [unit] }

const corpus: Corpus = {
  pages: new Map([
    [5, { pdfPage: 5, bookPage: 5, chapter: 1, text: TEXT }],
    [6, { pdfPage: 6, bookPage: 6, chapter: 1, text: 'Boş sayfa.' }],
    [7, { pdfPage: 7, bookPage: 7, chapter: 1, text: 'Son sayfa.' }]
  ]),
  chapters: [{ chapter: 1, title: 'Makine', pdfPages: [5, 7], bookPages: [5, 7] }],
  sha256: 'd'.repeat(64),
  file: 'kitap.pdf',
  pageOffset: 0
}

const labels: LabelRow[] = [
  {
    dosya: 'e0005-1.png',
    pdfSayfa: 5,
    sekil: '3-7',
    etiketler: [
      { metin: 'APL valvi', kutu: [0.1, 0.1, 0.2, 0.05] },
      { metin: 'Karbondioksit absorbanı', kutu: [0.5, 0.2, 0.3, 0.1] },
      { metin: 'Rezervuar balon', kutu: [0.2, 0.7, 0.2, 0.1] },
      { metin: 'Taze gaz girişi', kutu: [0.6, 0.6, 0.2, 0.05] },
      { metin: 'Valf A', kutu: [0.0, 0.9, 0.1, 0.05] },
      { metin: 'Valf B', kutu: [0.2, 0.9, 0.1, 0.05] }
    ]
  }
]

const QUOTE = 'APL valvi devredeki basıncı sınırlar ve fazla gazı atık sistemine verir.'

function base(extra: Record<string, unknown>): Record<string, unknown> {
  return {
    alinti: QUOTE,
    sayfa: { baslangic: 5, bitis: 5 },
    kavram: 'APL valvi',
    kok: 'Kök',
    siklar: [
      { anahtar: 'A', metin: 'Bir' },
      { anahtar: 'B', metin: 'İki' }
    ],
    dogru: 'A',
    celdiriciler: [{ anahtar: 'B', aciklama: 'Yanlış.' }],
    cozum: [{ tur: 'text', metin: 'Çözüm.' }],
    zorluk: 'orta',
    etiketler: ['makine'],
    ...extra
  }
}

function map(extra: Record<string, unknown>): ReturnType<typeof mapUnit> {
  return mapUnit(l, corpus, unit, Generated.parse({ sorular: [base(extra)] }), labels)
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qf-gorsel-'))
  l = {
    rules: Rules.parse({
      module: { id: 'qm', ad: 'M', surum: '0.1.0' },
      kaynak: { tip: 'pdf', yol: 'x.pdf', kulliyat: 'p', bolumHaritasi: 'c', govde: [1, 99] },
      uretim: { sikSayisi: 5 }
    }),
    rulesHash: 'r',
    root: tmp,
    dir: tmp,
    buildDir: path.join(tmp, 'build')
  }
})

afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('etiket eşleme', () => {
  it('matches exact, normalized and fuzzy labels', () => {
    const row = labels[0]!
    expect(matchLabel(row, 'APL valvi')).toMatchObject({ ok: true, kutu: [0.1, 0.1, 0.2, 0.05] })
    expect(matchLabel(row, 'apl-valvi.')).toMatchObject({ ok: true, metin: 'APL valvi' })
    expect(matchLabel(row, 'Karbondioksit absorbani')).toMatchObject({
      ok: true,
      metin: 'Karbondioksit absorbanı'
    })
    expect(matchLabel(row, 'Vaporizatör').ok).toBe(false)
  })

  it('refuses ambiguous labels', () => {
    const row: LabelRow = {
      dosya: 'x.png',
      pdfSayfa: 5,
      etiketler: [
        { metin: 'Valf', kutu: [0, 0, 0.1, 0.1] },
        { metin: 'valf.', kutu: [0.5, 0.5, 0.1, 0.1] }
      ]
    }
    const r = matchLabel(row, 'Valf')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/belirsiz/)
  })

  it('detects a label inside a stem with Turkish suffixes', () => {
    expect(mentions('APL valvinin görevi nedir?', 'APL valvi')).toBe(true)
    expect(mentions('İşaretli yapının görevi nedir?', 'APL valvi')).toBe(false)
  })
})

describe('mapUnit görsel alanları', () => {
  it('builds a marking question with boxes from the label index', () => {
    const r = map({
      tip: 'isaretleme',
      kok: 'Devredeki basıncı sınırlayan yapı hangisidir? Görselde işaretleyin.',
      gorsel: 'e0005-1.png',
      gorselAlt: 'Döngüsel solunum devresinin şeması.',
      siklar: [],
      isaretler: [
        { anahtar: 'A', etiket: 'APL valvi' },
        { anahtar: 'B', etiket: 'Rezervuar balon' },
        { anahtar: 'C', etiket: 'Taze gaz girişi' },
        { anahtar: 'D', etiket: 'Karbondioksit absorbanı' },
        { anahtar: 'E', etiket: 'Valf A' }
      ],
      dogru: 'A',
      celdiriciler: [
        { anahtar: 'B', aciklama: 'Balon el ile ventilasyon içindir.' },
        { anahtar: 'C', aciklama: 'Taze gaz buradan girer.' },
        { anahtar: 'D', aciklama: 'Karbondioksiti tutar.' },
        { anahtar: 'E', aciklama: 'Tek yönlü valftir.' }
      ]
    })
    expect(r.dropped).toEqual([])
    const q = r.questions[0]!
    expect(q.kind).toBe('isaretleme')
    expect(q.stem.imageRef).toBe('assets/img/e0005-1.png')
    expect(q.stem.alt).toBe('Döngüsel solunum devresinin şeması.')
    expect(q.correct).toBe('D')
    expect(q.distractors.A).toBe('Karbondioksiti tutar.')
    const right = q.choices.find((c) => c.key === q.correct)!
    expect(right.md).toBe('APL valvi')
    expect(right.box).toEqual([0.1, 0.1, 0.2, 0.05])
    for (const c of q.choices) expect(c.box).toBeDefined()
  })

  it('drops a marking question whose label is not in the index', () => {
    const r = map({
      tip: 'isaretleme',
      gorsel: 'e0005-1.png',
      siklar: [],
      isaretler: [
        { anahtar: 'A', etiket: 'APL valvi' },
        { anahtar: 'B', etiket: 'Vaporizatör' }
      ]
    })
    expect(r.questions).toEqual([])
    expect(r.dropped[0]!.reason).toMatch(/etiket bulunamadı/)
  })

  it('resolves masks and drops leaking or unknown masks', () => {
    const ok = map({
      kok: 'Görselde işaretli yapının görevi nedir?',
      gorsel: 'e0005-1.png',
      maskeler: ['APL valvi']
    })
    expect(ok.questions[0]!.stem.masks).toEqual([{ box: [0.1, 0.1, 0.2, 0.05] }])
    const leak = map({
      kok: 'APL valvinin görevi nedir?',
      gorsel: 'e0005-1.png',
      maskeler: ['APL valvi']
    })
    expect(leak.dropped[0]!.reason).toMatch(/sızıntı/)
    const none = map({ kok: 'İşaretli yapı?', gorsel: 'yok.png', maskeler: ['APL valvi'] })
    expect(none.dropped[0]!.reason).toMatch(/etiket dizininde görsel yok/)
  })

  it('maps tablo and cozumTablosu to Table blocks', () => {
    const tablo = {
      baslik: 'Tablo 3-3 İndüksiyon dozları',
      basliklar: ['İlaç', 'Doz'],
      satirlar: [
        ['Propofol', '1-2,5 mg/kg'],
        ['Etomidat', '0,2-0,5 mg/kg']
      ],
      satirBasligi: true
    }
    const r = map({
      kok: 'Tabloya göre hangisi?',
      tablo,
      cozumTablosu: { ...tablo, baslik: undefined }
    })
    const q = r.questions[0]!
    expect(q.stem.table).toEqual({
      header: ['İlaç', 'Doz'],
      rows: [
        ['Propofol', '1-2,5 mg/kg'],
        ['Etomidat', '0,2-0,5 mg/kg']
      ],
      caption: 'Tablo 3-3 İndüksiyon dozları',
      rowHeader: true
    })
    expect(q.solution.at(-1)).toMatchObject({ type: 'table', header: ['İlaç', 'Doz'] })
  })
})

function question(over: Partial<Question>): Question {
  return {
    id: 'qm-1',
    conceptId: 'k',
    stem: { md: 'Kök' },
    kind: 'coktan-secmeli',
    choices: [
      { key: 'A', md: 'Bir' },
      { key: 'B', md: 'İki' }
    ],
    correct: 'A',
    distractors: { B: 'x' },
    solution: [{ type: 'text', md: 'c' }],
    source: { file: 'kitap.pdf', pages: [5, 5], quote: QUOTE },
    difficulty: 'orta',
    tags: [],
    vurgu: [],
    contentHash: 'e'.repeat(64),
    deleted: false,
    ...over
  }
}

describe('verify görsel denetimleri', () => {
  it('warns on a stem image without alt', () => {
    const r = checkVisual(
      question({ stem: { md: 'K', imageRef: 'assets/img/a.png' } }),
      TEXT,
      labels
    )
    expect(r.warnings.map((w) => w.code)).toEqual(['alt'])
  })

  it('accepts a table from the page and rejects an invented one', () => {
    const real = toTable({
      basliklar: ['İlaç', 'Doz'],
      satirlar: [
        ['Propofol', '1-2,5 mg/kg'],
        ['Ketamin', '1-2 mg/kg']
      ]
    })
    expect(cellCoverage(real, TEXT)).toBe(1)
    expect(checkVisual(question({ stem: { md: 'K', table: real } }), TEXT, labels).errors).toEqual(
      []
    )
    const fake = toTable({
      basliklar: ['İlaç', 'Doz'],
      satirlar: [
        ['Midazolam', '0,1 mg/kg'],
        ['Tiyopental', '4 mg/kg']
      ]
    })
    const r = checkVisual(question({ solution: [{ type: 'table', ...fake }] }), TEXT, labels)
    expect(r.errors.map((e) => e.code)).toEqual(['table-source'])
    const ok = checkVisual(
      question({ solution: [{ type: 'table', ...fake }] }),
      TEXT,
      labels,
      new Set([tableHash(fake)])
    )
    expect(ok.errors).toEqual([])
    expect(ok.warnings.map((w) => w.code)).toEqual(['table-visual'])
  })

  it('tolerates OCR notation in table cells', () => {
    const ocr = 'Gaz O2 N2O Basınç psig 1900 745 a1 reseptör agonisti b1'
    const t = toTable({
      basliklar: ['Gaz', 'Basınç¹ (psig)'],
      satirlar: [
        ['O₂', '1900'],
        ['N₂O', '745'],
        ['α1 reseptör agonisti', 'β1']
      ]
    })
    expect(cellCoverage(t, ocr)).toBe(1)
  })

  it('flags a masked label that appears in the stem', () => {
    const q = question({
      stem: {
        md: 'APL valvinin görevi nedir?',
        imageRef: 'assets/img/e0005-1.png',
        alt: 'Şema',
        masks: [{ box: [0.1, 0.1, 0.2, 0.05] }]
      }
    })
    expect(checkVisual(q, TEXT, labels).errors.map((e) => e.code)).toEqual(['leak'])
  })

  it('flags a marking question whose correct label repeats', () => {
    const q = question({
      kind: 'isaretleme',
      stem: { md: 'Hangisi?', imageRef: 'assets/img/e0005-1.png', alt: 'Şema' },
      choices: [
        { key: 'A', md: 'APL valvi', box: [0.1, 0.1, 0.2, 0.05] },
        { key: 'B', md: 'APL Valvi.', box: [0.5, 0.2, 0.3, 0.1] }
      ]
    })
    expect(checkVisual(q, TEXT, labels).errors.map((e) => e.code)).toEqual(['dup-choice'])
  })
})

describe('geri-al gidiş-dönüş', () => {
  it('restores a packed module into build/units and packs it back identically', () => {
    fs.mkdirSync(path.join(l.buildDir, 'figures'), { recursive: true })
    fs.writeFileSync(path.join(l.buildDir, 'figures', 'e0005-1.png'), 'png')
    const mapped = mapUnit(
      l,
      corpus,
      unit,
      Generated.parse({
        sorular: [
          base({ kok: 'Metin sorusu?' }),
          base({ kok: 'Görsel sorusu?', gorsel: 'e0005-1.png', gorselAlt: 'Şema' })
        ]
      }),
      labels
    )
    expect(mapped.questions).toHaveLength(2)
    const kesit = {
      pdfSayfa: 5,
      bbox: [0, 0, 1, 1] as [number, number, number, number],
      ref: 'assets/kaynak/5.webp'
    }
    mapped.questions[0]!.source.kesit = kesit
    const out: UnitOutput = {
      unitId: unit.unitId,
      hash: unit.hash,
      pages: unit.pages,
      questions: mapped.questions,
      dropped: []
    }
    fs.mkdirSync(unitsDir(l), { recursive: true })
    fs.writeFileSync(path.join(unitsDir(l), unit.unitId + '.json'), JSON.stringify(out))
    const kaynak = path.join(tmp, 'modules', 'qm', 'assets', 'kaynak')
    fs.mkdirSync(kaynak, { recursive: true })
    fs.writeFileSync(path.join(kaynak, '5.webp'), 'webp')
    expect(verify(l, corpus).ok).toBe(true)
    const mod = pack(l, corpus)
    const before = JSON.parse(fs.readFileSync(path.join(mod, 'module.json'), 'utf8'))

    fs.rmSync(l.buildDir, { recursive: true, force: true })
    const r = geriAl(l, corpus, plan)
    expect(r).toMatchObject({ questions: 2, units: 2, unplaced: 0, images: 1 })
    expect(fs.readdirSync(unitsDir(l)).sort()).toEqual(['b01-p5-7-gorsel.json', 'b01-p5-7.json'])
    const cp = loadCheckpoint(l, corpus.sha256)
    expect(cp.units[unit.hash]?.status).toBe('done')
    expect(cp.units[unit.hash + ':gorsel']?.status).toBe('done')
    expect(() => geriAl(l, corpus, plan)).toThrow(/--force/)

    expect(verify(l, corpus).ok).toBe(true)
    pack(l, corpus)
    const after = JSON.parse(fs.readFileSync(path.join(mod, 'module.json'), 'utf8'))
    expect(after.blocks).toEqual(before.blocks)
    expect(after.questionCount).toBe(2)
    expect(fs.existsSync(path.join(kaynak, '5.webp'))).toBe(true)
    const block = JSON.parse(fs.readFileSync(path.join(mod, 'blocks', '0001.json'), 'utf8'))
    expect(block.questions.find((q: Question) => q.source.kesit)?.source.kesit).toEqual(kesit)
  })

  it('refuses to pack an empty build', () => {
    fs.mkdirSync(l.buildDir, { recursive: true })
    fs.writeFileSync(
      path.join(l.buildDir, 'verify-report.json'),
      JSON.stringify({ ok: true, errors: [] })
    )
    expect(() => pack(l, corpus)).toThrow(/boş/)
  })
})
