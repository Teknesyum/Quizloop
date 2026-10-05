import { describe, expect, it } from 'vitest'
import { Question } from '../../../../src/shared/schema/question.ts'
import { AYET_SAYILARI, caprazDenetle, sayimDenetle, type Meal, type Sure } from './kaynak.ts'
import { kelimeler, kok, parcala, sade } from './metin.ts'
import { baglamlar, donus, isaretle, parcalar, uret } from './uret.ts'

const T = 'ؕ'
const C = 'ۚ'
const LA = 'ۙ'

function sure(no: number, ad: string, ayetler: string[]): Sure {
  return {
    no,
    ad,
    besmele: true,
    ayetler: ayetler.map((metin, i) => ({ sure: no, ayet: i + 1, sayfa: 21 - no, cuz: 1, metin }))
  }
}

describe('parcala', () => {
  it('durak işaretinde böler, metni değiştirmez', () => {
    const metin = `بب تت ثث${T} جج حح خخ${C} دد ذذ رر`
    const p = parcala(metin)
    expect(p.map((x) => x.length)).toEqual([3, 3, 3])
    expect(p.flat().join(' ')).toBe(metin)
  })

  it('lâ işaretinde bölmez', () => {
    expect(parcala(`بب تت ثث${LA} جج حح خخ`)).toHaveLength(1)
  })

  it('kısa parçayı öncekine, baştaysa sonrakine katar', () => {
    expect(parcala(`بب تت ثث${T} جج${T} دد ذذ رر`).map((x) => x.length)).toEqual([4, 3])
    expect(parcala(`بب${T} تت ثث جج${T} دد ذذ رر`).map((x) => x.length)).toEqual([4, 3])
    expect(parcala(`بب${T}`)).toEqual([[`بب${T}`]])
  })
})

describe('sade ve kok', () => {
  it('harekeyi ve durak işaretini atar', () => {
    expect(sade(`اَلْحَمْدُ لِلّٰهِ${T}`)).toBe('الحمد لله')
  })

  it('iki imlayı aynı köke indirir', () => {
    expect(kok('الْكِتَابُ')).toBe(kok('ٱلْكِتَـٰبُ'))
  })
})

describe('sayimDenetle', () => {
  it('sayım tablosu 114 sure ve 6236 ayettir', () => {
    expect(AYET_SAYILARI).toHaveLength(114)
    expect(AYET_SAYILARI.reduce((a, b) => a + b, 0)).toBe(6236)
  })

  it('eksik sureyi reddeder', () => {
    expect(() => sayimDenetle([sure(1, 'a', ['بب'])])).toThrow(/114/)
  })
})

describe('uret', () => {
  const sureler = [
    sure(1, 'Bir', [`بب تت ثث${T} جج حح خخ`, 'دد ذذ رر', `سس شش صص${T} طط ظظ عع`]),
    sure(2, 'İki', ['دد ذذ رر', 'فف قق كك', `سس شش صص${T} لل مم نن`])
  ]
  const meal: Meal = { ad: 'Deneme', tam: {}, kelime: {} }
  for (const s of sureler) {
    for (const a of s.ayetler) {
      meal.tam[`${a.sure}:${a.ayet}`] = `meal ${a.sure}:${a.ayet}`
      meal.kelime[`${a.sure}:${a.ayet}`] = kelimeler(a.metin).map((k, i) => [k, `anlam${i}`])
    }
  }

  it('her parça için bir açık uçlu soru üretir, cevap sonraki parçadır', () => {
    const p = parcalar(sureler)
    const r = uret(sureler, meal, { sikli: false })
    expect(r.acik).toBe(p.length - 1)
    r.sorular.forEach((q, i) => {
      expect(q.beklenenCevap).toBe(p[i + 1]!.metin)
      expect(() => Question.parse(q)).not.toThrow()
    })
  })

  it('aynı gövde farklı devam ediyorsa önceki parçayı ekler', () => {
    const p = parcalar(sureler)
    const k = baglamlar(p)
    const i = p.findIndex((x) => x.sure === 2 && x.ayet === 1)
    expect(k[i]).toBeGreaterThan(0)
    const q = uret(sureler, meal, { sikli: false }).sorular[i]!
    expect(q.stem.md).toContain('۝')
    expect(q.stem.md.endsWith('\n\nBu durağın devamı nedir?')).toBe(true)
  })

  it('sure geçişini etiketler ve Besmele notu düşer', () => {
    const q = uret(sureler, meal, { sikli: false }).sorular.find((x) =>
      x.tags.includes('gecis:sure')
    )!
    expect(q.solution[0]).toMatchObject({ type: 'text' })
    expect(JSON.stringify(q.solution[0])).toContain('Besmele')
  })

  it('cevap parçasının kutusu kendi kelimelerinin kutularından birleşir', () => {
    const cevap = parcalar(sureler)[1]!
    expect([cevap.bas, cevap.son, cevap.ayetKelime]).toEqual([3, 6, 6])
    expect(
      isaretle(
        [
          [7, 250, 10, 300, 40],
          [7, 200, 10, 240, 40],
          [7, 150, 10, 190, 40],
          [7, 100, 10, 140, 40],
          null,
          [7, 110, 46, 150, 76]
        ],
        cevap
      )
    ).toEqual([
      { pdfSayfa: 7, bbox: [100, 10, 140, 40] },
      { pdfSayfa: 7, bbox: [110, 46, 150, 76] }
    ])
    expect(isaretle([[7, 100, 10, 300, 40]], cevap)).toEqual([])
  })

  it('kelime meali cevap parçasına kırpılır', () => {
    const q = uret(sureler, meal, { sikli: false }).sorular[0]!
    const tablo = q.solution.find((b) => b.type === 'table')
    expect(tablo && tablo.type === 'table' && tablo.rows.map((r) => r[1])).toEqual([
      'anlam3',
      'anlam4',
      'anlam5'
    ])
  })

  it('çoktan seçmelide her şık metinde aynen geçen bir parçadır', () => {
    const p = new Set(parcalar(sureler).map((x) => x.metin))
    const r = uret(sureler, meal)
    for (const q of r.sorular.filter((x) => x.kind === 'coktan-secmeli')) {
      expect(() => Question.parse(q)).not.toThrow()
      expect(new Set(q.choices.map((c) => c.md)).size).toBe(q.choices.length)
      for (const c of q.choices) expect(p.has(c.md)).toBe(true)
    }
  })

  it('şıklı üretimde parça başına tek kart çıkar, hepsi şıklıdır', () => {
    const r = uret(sureler, meal)
    expect(r.sorular).toHaveLength(parcalar(sureler).length - 1)
    expect(new Set(r.sorular.map((q) => q.id)).size).toBe(r.sorular.length)
    expect(r.acik).toBe(0)
    for (const q of r.sorular) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices.find((c) => c.key === q.correct)!.md).toBe(q.source.quote)
    }
  })

  it('aynı girdi aynı çıktıyı verir', () => {
    expect(uret(sureler, meal)).toEqual(uret(sureler, meal))
  })
})

describe('donus', () => {
  it('her cüzün son sayfası birinci, ilk sayfası yirminci dönüştür', () => {
    expect(donus(1, 20)).toBe(1)
    expect(donus(1, 1)).toBe(20)
    expect(donus(2, 24)).toBe(17)
    expect(donus(29, 580)).toBe(1)
    expect(donus(29, 561)).toBe(20)
  })

  it('otuzuncu cüzün son beş sayfası tek dönüştür', () => {
    expect([600, 601, 602, 603, 604].map((s) => donus(30, s))).toEqual([1, 1, 1, 1, 1])
    expect(donus(30, 599)).toBe(2)
    expect(donus(30, 581)).toBe(20)
  })

  it('dönüş çözümde, yanlış şık açıklamasında ve etikette yazar', () => {
    const s = [
      sure(1, 'Bir', [`بب تت ثث${T} جج حح خخ`, 'دد ذذ رر', `سس شش صص${T} طط ظظ عع`]),
      sure(2, 'İki', ['دد ذذ رر', 'فف قق كك', `سس شش صص${T} لل مم نن`])
    ]
    const r = uret(s, null)
    const q = r.sorular.find((x) => x.id === 'kh-001-001-00')!
    expect(q.solution[0]).toEqual({
      type: 'text',
      md: '**Bir Suresi 1:1 · Sayfa 20 · 1. Cüz · 1. Dönüşün Başı**'
    })
    expect(q.tags).toContain('donus:01')
    expect(q.tags).toContain('kesim:bas')
    expect(parcalar(s).map((x) => x.kesim)).toEqual([
      'bas',
      'bas',
      'orta',
      'son',
      'son',
      'bas',
      'orta',
      'orta',
      'son'
    ])
    for (const d of Object.values(q.distractors))
      expect(d).toMatch(/Sayfa \d+ · 1\. Cüz · \d+\. Dönüşün (Başı|Ortası|Sonu)/)
    expect(new Set(r.sorular.map((x) => x.source.chapter))).toEqual(new Set(['1. Cüz']))
  })
})

describe('caprazDenetle', () => {
  it('harf farkını ayet anahtarıyla bildirir', () => {
    const s = [sure(1, 'Bir', ['بب تت', 'جج حح'])]
    const m: Meal = {
      ad: 'x',
      tam: { '1:1': 'a', '1:2': 'b' },
      kelime: {
        '1:1': [
          ['بب', 'a'],
          ['تت', 'b']
        ],
        '1:2': [
          ['جج', 'a'],
          ['خخ', 'b']
        ]
      }
    }
    expect(caprazDenetle(s, m)).toEqual({ ayet: 2, kokFarki: ['1:2'], kelimeEsit: 2 })
  })
})
