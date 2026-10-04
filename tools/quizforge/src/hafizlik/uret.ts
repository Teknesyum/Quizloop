import { ChoiceKey, type Question as QuestionT } from '../../../../src/shared/schema/question.ts'
import { canonical, sha256 } from '../hash.ts'
import type { KelimeMeal, Meal, Sure } from './kaynak.ts'
import { AYET_SONU, ilkIki, parcala, sade, sonIki } from './metin.ts'

export type Kesim = 'bas' | 'orta' | 'son'

export interface Parca {
  sure: number
  ayet: number
  sira: number
  bas: number
  son: number
  ayetKelime: number
  metin: string
  sade: string
  sayfa: number
  cuz: number
  kesim: Kesim
}

export interface Secenekler {
  enAz?: number
  baglam?: number
  cuzler?: Set<number>
  sikli?: boolean
}

const EN_COK_BAGLAM = 3
const SIK_ADEDI = 4
const DOLGU_UZAKLIK = 60
const CUZ_SAYFA = 20
const SON_CUZ = 30
const SON_SAYFA = 604
const ILK_DONUS_SAYFA = 5
const KESIM_ADI: Record<Kesim, string> = { bas: 'Başı', orta: 'Ortası', son: 'Sonu' }

export function donus(cuz: number, sayfa: number): number {
  if (cuz < SON_CUZ) return cuz * CUZ_SAYFA - sayfa + 1
  const geri = SON_SAYFA - sayfa
  return geri < ILK_DONUS_SAYFA ? 1 : geri - ILK_DONUS_SAYFA + 2
}

export function parcalar(sureler: Sure[], enAz?: number): Parca[] {
  const cikti: Parca[] = []
  for (const s of sureler) {
    for (const a of s.ayetler) {
      const p = parcala(a.metin, enAz)
      const toplam = p.reduce((n, x) => n + x.length, 0)
      let bas = 0
      p.forEach((k, sira) => {
        const metin = k.join(' ')
        cikti.push({
          sure: a.sure,
          ayet: a.ayet,
          sira,
          bas,
          son: bas + k.length,
          ayetKelime: toplam,
          metin,
          sade: sade(metin),
          sayfa: a.sayfa,
          cuz: a.cuz,
          kesim: 'bas'
        })
        bas += k.length
      })
    }
  }
  const tur = (x: Parca): string => `${x.cuz}:${donus(x.cuz, x.sayfa)}`
  const toplam = new Map<string, number>()
  for (const x of cikti) toplam.set(tur(x), (toplam.get(tur(x)) ?? 0) + x.son - x.bas)
  const gecen = new Map<string, number>()
  for (const x of cikti) {
    const once = gecen.get(tur(x)) ?? 0
    const oran = (once + (x.son - x.bas) / 2) / toplam.get(tur(x))!
    x.kesim = oran < 1 / 3 ? 'bas' : oran < 2 / 3 ? 'orta' : 'son'
    gecen.set(tur(x), once + x.son - x.bas)
  }
  return cikti
}

export function baglamlar(p: Parca[], enCok = EN_COK_BAGLAM): number[] {
  const cikti = new Array<number>(p.length).fill(enCok)
  const anahtar = (i: number, k: number): string =>
    p
      .slice(Math.max(0, i - k), i + 1)
      .map((x) => x.sade)
      .join(' | ')
  let acik = p.map((_x, i) => i).filter((i) => i + 1 < p.length)
  for (let k = 0; k <= enCok && acik.length; k += 1) {
    const devam = new Map<string, Set<string>>()
    for (let i = 0; i + 1 < p.length; i += 1) {
      const a = anahtar(i, k)
      const s = devam.get(a) ?? new Set<string>()
      s.add(p[i + 1]!.sade)
      devam.set(a, s)
    }
    const kalan: number[] = []
    for (const i of acik) {
      if (devam.get(anahtar(i, k))!.size === 1) cikti[i] = k
      else kalan.push(i)
    }
    acik = kalan
  }
  return cikti
}

function govde(p: Parca[], i: number, k: number): string {
  let out = ''
  for (let j = Math.max(0, i - k); j <= i; j += 1) {
    const x = p[j]!
    if (out) out += x.sira === 0 ? ` ${AYET_SONU} ` : ' '
    out += x.metin
  }
  return out
}

interface Aday {
  hedef: number
  kaynak: number
  puan: number
}

function dizin(p: Parca[], al: (s: string) => string | null): Map<string, number[]> {
  const m = new Map<string, number[]>()
  p.forEach((x, i) => {
    const a = al(x.sade)
    if (!a) return
    const l = m.get(a)
    if (l) l.push(i)
    else m.set(a, [i])
  })
  return m
}

export interface Dizinler {
  bas: Map<string, number[]>
  son: Map<string, number[]>
}

export function dizinler(p: Parca[]): Dizinler {
  return { bas: dizin(p, ilkIki), son: dizin(p, sonIki) }
}

export function celdiriciler(p: Parca[], d: Dizinler, i: number): Aday[] {
  const soru = p[i]!
  const cevap = p[i + 1]!
  const puan = new Map<number, number>()
  const ekle = (m: Map<string, number[]>, a: string | null, deger: number): void => {
    if (!a) return
    for (const j of m.get(a) ?? []) if (j !== i) puan.set(j, (puan.get(j) ?? 0) + deger)
  }
  ekle(d.bas, ilkIki(soru.sade), 1)
  ekle(d.son, sonIki(soru.sade), 2)
  const adaylar: Aday[] = []
  for (const [j, deger] of puan) {
    if (j + 1 < p.length) adaylar.push({ hedef: j + 1, kaynak: j, puan: deger })
  }
  const a = ilkIki(cevap.sade)
  if (a) {
    for (const j of d.bas.get(a) ?? [])
      if (j !== i + 1) adaylar.push({ hedef: j, kaynak: -1, puan: 0 })
  }
  adaylar.sort(
    (x, y) => y.puan - x.puan || Math.abs(x.hedef - i) - Math.abs(y.hedef - i) || x.hedef - y.hedef
  )
  const gorulen = new Set([cevap.sade, soru.sade])
  const secilen: Aday[] = []
  for (const x of adaylar) {
    const s = p[x.hedef]!.sade
    if (gorulen.has(s)) continue
    gorulen.add(s)
    secilen.push(x)
    if (secilen.length === SIK_ADEDI - 1) break
  }
  if (secilen.length === SIK_ADEDI - 1) return secilen
  const kafiye = cevap.sade.slice(-1)
  const dolgu: { j: number; sira: number }[] = []
  for (let j = Math.max(0, i - DOLGU_UZAKLIK); j < Math.min(p.length, i + DOLGU_UZAKLIK); j += 1) {
    if (j === i || j === i + 1) continue
    const x = p[j]!
    const ceza = (x.sure === cevap.sure ? 0 : 2) + (x.sade.slice(-1) === kafiye ? 0 : 1)
    dolgu.push({ j, sira: ceza * DOLGU_UZAKLIK * 2 + Math.abs(j - (i + 1)) })
  }
  dolgu.sort((x, y) => x.sira - y.sira || x.j - y.j)
  for (const x of dolgu) {
    const y = p[x.j]!.sade
    if (gorulen.has(y)) continue
    gorulen.add(y)
    secilen.push({ hedef: x.j, kaynak: -2, puan: 0 })
    if (secilen.length === SIK_ADEDI - 1) break
  }
  return secilen
}

function kacis(metin: string): string {
  return metin.replace(/([\\*_`<>[\]|~])/g, '\\$1')
}

export function yer(sureler: Sure[], x: Parca): string {
  const ad = kacis(sureler[x.sure - 1]!.ad)
  return `${ad} Suresi ${x.sure}:${x.ayet} · Sayfa ${x.sayfa} · ${x.cuz}. Cüz · ${donus(x.cuz, x.sayfa)}. Dönüşün ${KESIM_ADI[x.kesim]}`
}

function kimlik(x: Parca): string {
  const n = (v: number, w: number): string => String(v).padStart(w, '0')
  return `kh-${n(x.sure, 3)}-${n(x.ayet, 3)}-${n(x.sira, 2)}`
}

function cozum(
  sureler: Sure[],
  meal: Meal | null,
  soru: Parca,
  cevap: Parca
): QuestionT['solution'] {
  const s = sureler[cevap.sure - 1]!
  const anahtar = `${cevap.sure}:${cevap.ayet}`
  const gecis =
    soru.sure !== cevap.sure
      ? s.besmele
        ? ' · Sure Geçişi, Arada Besmele Okunur'
        : ' · Sure Geçişi, Arada Besmele Okunmaz'
      : ''
  const blok: QuestionT['solution'] = [
    { type: 'text', md: `**${yer(sureler, cevap)}**${gecis}` },
    { type: 'text', md: s.ayetler[cevap.ayet - 1]!.metin }
  ]
  if (!meal) return blok
  blok.push({ type: 'text', md: `**Meal (${kacis(meal.ad)}):** ${kacis(meal.tam[anahtar]!)}` })
  const w: KelimeMeal = meal.kelime[anahtar]!
  const esit = w.length === cevap.ayetKelime
  const satir = (esit ? w.slice(cevap.bas, cevap.son) : w).filter((x) => x[0] && x[1])
  if (satir.length) {
    blok.push({
      type: 'table',
      header: ['Kelime', 'Anlamı'],
      rows: satir.map((x) => [x[0], x[1]]),
      caption: esit ? 'Kelime Kelime Meal: Cevap Parçası' : 'Kelime Kelime Meal: Ayetin Tamamı'
    })
  }
  return blok
}

function ozet(q: Omit<QuestionT, 'contentHash'>): string {
  return sha256(
    canonical({ stem: q.stem, choices: q.choices, correct: q.correct, solution: q.solution })
  )
}

export interface Uretim {
  sorular: QuestionT[]
  acik: number
  sikli: number
  mutesabih: number
  baglamli: number
  belirsiz: number
}

export function uret(sureler: Sure[], meal: Meal | null, sec: Secenekler = {}): Uretim {
  const p = parcalar(sureler, sec.enAz)
  const k = baglamlar(p, sec.baglam)
  const d = dizinler(p)
  const sorular: QuestionT[] = []
  let acik = 0
  let sikli = 0
  let mutesabih = 0
  let baglamli = 0
  let belirsiz = 0
  const devam = new Map<string, Set<string>>()
  for (let i = 0; i + 1 < p.length; i += 1) {
    const a = govde(p, i, k[i]!)
    const s = devam.get(sade(a)) ?? new Set<string>()
    s.add(p[i + 1]!.sade)
    devam.set(sade(a), s)
  }
  for (let i = 0; i + 1 < p.length; i += 1) {
    const soru = p[i]!
    const cevap = p[i + 1]!
    if (sec.cuzler && !sec.cuzler.has(soru.cuz)) continue
    const sure = sureler[soru.sure - 1]!
    const tur = donus(soru.cuz, soru.sayfa)
    let md = govde(p, i, k[i]!)
    if (k[i]! > 0) baglamli += 1
    const etiket = [
      `cuz:${String(soru.cuz).padStart(2, '0')}`,
      `sure:${String(soru.sure).padStart(3, '0')}`,
      `sayfa:${String(soru.sayfa).padStart(3, '0')}`,
      `donus:${String(tur).padStart(2, '0')}`,
      `kesim:${soru.kesim}`,
      'tip:devam'
    ]
    if (soru.sure !== cevap.sure) etiket.push('gecis:sure')
    if (devam.get(sade(md))!.size > 1) {
      belirsiz += 1
      md += `\n\n${kacis(sure.ad)} Suresi, ${soru.ayet}. Ayet`
    }
    const ortak = {
      conceptId: `${soru.sure}:${soru.ayet}/${soru.sira}`,
      stem: { md },
      solution: cozum(sureler, meal, soru, cevap),
      source: {
        file: 'Kuran.pdf',
        pages: [cevap.sayfa, cevap.sayfa] as [number, number],
        quote: cevap.metin,
        chapter: `${soru.cuz}. Cüz`
      },
      vurgu: [],
      deleted: false
    }
    const acikSoru = {
      ...ortak,
      id: kimlik(soru),
      kind: 'acik-uclu' as const,
      choices: [],
      beklenenCevap: cevap.metin,
      distractors: {},
      difficulty: 'orta' as const,
      tags: etiket
    }
    const c = sec.sikli === false ? [] : celdiriciler(p, d, i)
    if (c.length < SIK_ADEDI - 1) {
      sorular.push({ ...acikSoru, contentHash: ozet(acikSoru) })
      acik += 1
      continue
    }
    const id = kimlik(soru)
    const benzer = c.some((x) => x.kaynak !== -2)
    const siklar = [{ hedef: i + 1, kaynak: i, puan: -1 }, ...c]
      .map((x) => ({ x, sira: sha256(`${id}|${p[x.hedef]!.sade}`) }))
      .sort((a, b) => a.sira.localeCompare(b.sira))
      .map((y, n) => ({ ...y.x, key: ChoiceKey.options[n]! }))
    const dogru = siklar.find((x) => x.hedef === i + 1)!.key
    const distractors: QuestionT['distractors'] = {}
    for (const x of siklar) {
      if (x.key === dogru) continue
      const h = p[x.hedef]!
      const konum = `**${yer(sureler, h)}**`
      distractors[x.key] =
        x.kaynak >= 0
          ? `${konum} · Şu benzer parçanın devamıdır: ${p[x.kaynak]!.metin}`
          : x.kaynak === -1
            ? `${konum} · Doğru cevapla aynı sözlerle başlar.`
            : `${konum} · Yakın bir yerde geçer, bu parçanın devamı değildir.`
    }
    const sikliSoru = {
      ...ortak,
      id,
      kind: 'coktan-secmeli' as const,
      choices: siklar.map((x) => ({ key: x.key, md: p[x.hedef]!.metin })),
      correct: dogru,
      distractors,
      difficulty: benzer ? ('zor' as const) : ('orta' as const),
      tags: benzer ? [...etiket, 'mutesabih'] : etiket
    }
    sorular.push({ ...sikliSoru, contentHash: ozet(sikliSoru) })
    sikli += 1
    if (benzer) mutesabih += 1
  }
  return { sorular, acik, sikli, mutesabih, baglamli, belirsiz }
}
