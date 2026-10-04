import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { kok } from './metin.ts'

export const MUSHAF_SURUM = '6411a76f41e986521da4cfb99a42221f767cbc89'
export const MUSHAF_URL = `https://raw.githubusercontent.com/alperenugus/Kuran/${MUSHAF_SURUM}/kuran.json`
export const MUSHAF_SHA256 = 'da8b017dbdc5b568b54ed97472622d61ee82fcde6bbb6e25ff54210fa4fc3b83'
export const KITAP_URL = `https://raw.githubusercontent.com/alperenugus/Kuran/${MUSHAF_SURUM}/Kuran.pdf`
export const KITAP_SHA256 = 'c783fdb334578300fb93c8287143ec59f6a0275c0a554a036dcbe90377c382b5'
export const MEAL_KIMLIK = 77
const API = 'https://api.quran.com/api/v4'

export const AYET_SAYILARI = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37,
  35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8,
  8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
]

export interface Ayet {
  sure: number
  ayet: number
  sayfa: number
  cuz: number
  metin: string
}

export interface Sure {
  no: number
  ad: string
  besmele: boolean
  ayetler: Ayet[]
}

export type KelimeMeal = [string, string][]

export interface Meal {
  ad: string
  tam: Record<string, string>
  kelime: Record<string, KelimeMeal>
}

interface HamSure {
  number: number
  name_turkish: string
  besmele: boolean
  ayahs: { ayah: number; printed_page: number; juz: number; text_unicode: string }[]
}

async function getir(url: string): Promise<Buffer> {
  let son: unknown
  for (let deneme = 0; deneme < 4; deneme += 1) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`${r.status} ${url}`)
      return Buffer.from(await r.arrayBuffer())
    } catch (e) {
      son = e
      await new Promise((ok) => setTimeout(ok, 1500 * (deneme + 1)))
    }
  }
  throw son instanceof Error ? son : new Error(String(son))
}

export function mushafCoz(ham: Buffer): Sure[] {
  const ozet = createHash('sha256').update(ham).digest('hex')
  if (ozet !== MUSHAF_SHA256) throw new Error(`mushaf sağlama toplamı tutmuyor: ${ozet}`)
  const veri = JSON.parse(ham.toString('utf8')) as { surahs: HamSure[] }
  const sureler = veri.surahs.map((s) => ({
    no: s.number,
    ad: s.name_turkish,
    besmele: s.besmele,
    ayetler: s.ayahs.map((a) => ({
      sure: s.number,
      ayet: a.ayah,
      sayfa: a.printed_page,
      cuz: a.juz,
      metin: a.text_unicode.trim()
    }))
  }))
  sayimDenetle(sureler)
  return sureler
}

export function sayimDenetle(sureler: Sure[]): void {
  if (AYET_SAYILARI.reduce((a, b) => a + b, 0) !== 6236) throw new Error('sayım tablosu 6236 değil')
  if (sureler.length !== 114) throw new Error(`sure sayısı ${sureler.length}, 114 olmalı`)
  sureler.forEach((s, i) => {
    if (s.no !== i + 1) throw new Error(`sure sırası bozuk: ${s.no}`)
    if (s.ayetler.length !== AYET_SAYILARI[i])
      throw new Error(`${s.no}. sure ${s.ayetler.length} ayet, ${AYET_SAYILARI[i]} olmalı`)
    s.ayetler.forEach((a, j) => {
      if (a.ayet !== j + 1) throw new Error(`${s.no}:${a.ayet} sırası bozuk`)
      if (!a.metin) throw new Error(`${s.no}:${a.ayet} boş`)
      if (a.cuz < 1 || a.cuz > 30) throw new Error(`${s.no}:${a.ayet} cüz ${a.cuz}`)
    })
  })
}

export async function mushafYukle(buildDir: string): Promise<Sure[]> {
  const dosya = path.join(buildDir, 'kuran.json')
  if (!fs.existsSync(dosya)) {
    fs.mkdirSync(buildDir, { recursive: true })
    fs.writeFileSync(dosya, await getir(MUSHAF_URL))
  }
  return mushafCoz(fs.readFileSync(dosya))
}

export async function kitapYukle(buildDir: string): Promise<string> {
  const dosya = path.join(buildDir, 'Kuran.pdf')
  if (!fs.existsSync(dosya)) {
    fs.mkdirSync(buildDir, { recursive: true })
    fs.writeFileSync(dosya, await getir(KITAP_URL))
  }
  const ozet = createHash('sha256').update(fs.readFileSync(dosya)).digest('hex')
  if (ozet !== KITAP_SHA256) throw new Error(`mushaf PDF sağlama toplamı tutmuyor: ${ozet}`)
  return dosya
}

interface ApiKelime {
  char_type_name: string
  text_uthmani: string
  translation?: { text: string | null }
}

interface ApiSayfa {
  verses: { verse_key: string; words: ApiKelime[] }[]
  pagination: { total_pages: number }
}

async function kelimeMealiIndir(
  sure: number,
  ilerle: (n: number) => void
): Promise<Record<string, KelimeMeal>> {
  const cikti: Record<string, KelimeMeal> = {}
  let sayfa = 1
  let toplam = 1
  while (sayfa <= toplam) {
    const url = `${API}/verses/by_chapter/${sure}?words=true&language=tr&word_fields=text_uthmani&per_page=50&page=${sayfa}`
    const j = JSON.parse((await getir(url)).toString('utf8')) as ApiSayfa
    toplam = j.pagination.total_pages
    for (const v of j.verses) {
      cikti[v.verse_key] = v.words
        .filter((w) => w.char_type_name === 'word')
        .map((w) => [w.text_uthmani, (w.translation?.text ?? '').trim()])
    }
    sayfa += 1
  }
  ilerle(sure)
  return cikti
}

export async function mealYukle(
  buildDir: string,
  kimlik: number,
  ilerle: (n: number) => void
): Promise<Meal> {
  const dosya = path.join(buildDir, `meal-${kimlik}.json`)
  if (fs.existsSync(dosya)) return JSON.parse(fs.readFileSync(dosya, 'utf8')) as Meal
  const t = JSON.parse((await getir(`${API}/quran/translations/${kimlik}`)).toString('utf8')) as {
    translations: { text: string }[]
    meta: { translation_name: string }
  }
  if (t.translations.length !== 6236)
    throw new Error(`meal ${t.translations.length} ayet, 6236 olmalı`)
  const tam: Record<string, string> = {}
  let k = 0
  AYET_SAYILARI.forEach((adet, s) => {
    for (let a = 1; a <= adet; a += 1) {
      tam[`${s + 1}:${a}`] = t.translations[k]!.text.replace(/<sup[^>]*>.*?<\/sup>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim()
      k += 1
    }
  })
  const kelime: Record<string, KelimeMeal> = {}
  for (let s = 1; s <= 114; s += 4) {
    const grup = await Promise.all(
      [s, s + 1, s + 2, s + 3].filter((n) => n <= 114).map((n) => kelimeMealiIndir(n, ilerle))
    )
    for (const g of grup) Object.assign(kelime, g)
  }
  const meal: Meal = { ad: t.meta.translation_name, tam, kelime }
  fs.mkdirSync(buildDir, { recursive: true })
  fs.writeFileSync(dosya, JSON.stringify(meal))
  return meal
}

export interface Capraz {
  ayet: number
  kokFarki: string[]
  kelimeEsit: number
}

export function caprazDenetle(sureler: Sure[], meal: Meal): Capraz {
  const kokFarki: string[] = []
  let kelimeEsit = 0
  let ayet = 0
  for (const s of sureler) {
    for (const a of s.ayetler) {
      const anahtar = `${a.sure}:${a.ayet}`
      const w = meal.kelime[anahtar]
      if (!w || !w.length) throw new Error(`kelime meali eksik: ${anahtar}`)
      if (!meal.tam[anahtar]) throw new Error(`meal eksik: ${anahtar}`)
      ayet += 1
      if (kok(a.metin) !== kok(w.map((x) => x[0]).join(' '))) kokFarki.push(anahtar)
      if (a.metin.split(/\s+/).length === w.length) kelimeEsit += 1
    }
  }
  return { ayet, kokFarki, kelimeEsit }
}
