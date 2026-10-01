import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { ChoiceKey } from '../../../src/shared/schema/question.ts'
import type { Loaded } from './rules.ts'
import { fixAnswerRefs, loadOutputs, unitsDir, type UnitOutput } from './generate.ts'

type QuestionT = UnitOutput['questions'][number]

export const KEYS = ['A', 'B', 'C', 'D', 'E'] as const
export const BENZERLIK = 0.8
export const BELIRGIN = 1.3
export const PARTI = 40

const BETIMLEME =
  /(soruluyor|sorulmaktadır|sorulmakta|soruldu|istenmektedir|isteniyor|istenmekte|beklenmektedir|bekleniyor)\s*[.:]?\s*$/iu
const BETIMLEME_ICINDE =
  /(soruluyor|sorulmaktadır|sorulmakta|istenmektedir|isteniyor|istenmekte|beklenmektedir|bekleniyor)/iu
const CEVAP = /([Cc]evap|[Cc]evabı|[Yy]anıt)(\s+)[A-E](?![\p{L}\p{N}])/gu
const HEPSI = /\b(hepsi|hiçbiri|tümü|yukarıdakilerin)\b/iu

export interface Olculen {
  id: string
  kok: string
  siklar: { key: string; md: string }[]
  dogru?: string
}

export function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLocaleLowerCase('tr')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
  )
}

export function kokler(s: string): Set<string> {
  return new Set([...tokens(s)].map((x) => x.slice(0, 5)))
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}

export function uzunluk(md: string): number {
  return md.replace(/\s+/g, ' ').trim().length
}

export function sira(siklar: Olculen['siklar'], dogru: string): number {
  const d = siklar.find((s) => s.key === dogru)
  if (!d) return 0
  const n = uzunluk(d.md)
  return 1 + siklar.filter((s) => s.key !== dogru && uzunluk(s.md) > n).length
}

export function belirginEnUzun(siklar: Olculen['siklar'], dogru: string): boolean {
  const d = siklar.find((s) => s.key === dogru)
  if (!d) return false
  const others = siklar.filter((s) => s.key !== dogru).map((s) => uzunluk(s.md))
  const second = Math.max(0, ...others)
  return uzunluk(d.md) >= BELIRGIN * Math.max(1, second)
}

export function benzerCiftler(siklar: Olculen['siklar']): [string, string, number][] {
  const out: [string, string, number][] = []
  const t = siklar.map((s) => tokens(s.md))
  for (let i = 0; i < siklar.length; i++)
    for (let j = i + 1; j < siklar.length; j++) {
      const v = jaccard(t[i]!, t[j]!)
      if (v >= BENZERLIK) out.push([siklar[i]!.key, siklar[j]!.key, v])
    }
  return out
}

export function betimleme(kok: string): boolean {
  return BETIMLEME.test(kok.trim())
}

export interface Olcum {
  n: number
  dogruEnUzun: number
  dogruEnUzunOran: number
  belirginEnUzun: number
  beklenenOran: number
  sira: Record<string, number>
  harf: Record<string, number>
  soruIsaretiYok: number
  betimlemeBitis: number
  betimlemeGecen: number
  benzerCiftliSoru: number
  benzerCift: number
  hepsiHicbiri: number
  ortUzunOrani: number
  ornekler: {
    betimleme: { id: string; kok: string }[]
    soruIsaretiYok: { id: string; kok: string }[]
    benzer: { id: string; a: string; b: string }[]
    belirgin: string[]
  }
}

export function olc(items: Olculen[]): Olcum {
  const o: Olcum = {
    n: 0,
    dogruEnUzun: 0,
    dogruEnUzunOran: 0,
    belirginEnUzun: 0,
    beklenenOran: 0,
    sira: {},
    harf: {},
    soruIsaretiYok: 0,
    betimlemeBitis: 0,
    betimlemeGecen: 0,
    benzerCiftliSoru: 0,
    benzerCift: 0,
    hepsiHicbiri: 0,
    ortUzunOrani: 0,
    ornekler: { betimleme: [], soruIsaretiYok: [], benzer: [], belirgin: [] }
  }
  let beklenen = 0
  let oran = 0
  for (const q of items) {
    if (!q.dogru || q.siklar.length < 2) continue
    o.n++
    beklenen += 1 / q.siklar.length
    const r = sira(q.siklar, q.dogru)
    o.sira[String(r)] = (o.sira[String(r)] ?? 0) + 1
    if (r === 1) o.dogruEnUzun++
    if (belirginEnUzun(q.siklar, q.dogru)) {
      o.belirginEnUzun++
      if (o.ornekler.belirgin.length < 10) o.ornekler.belirgin.push(q.id)
    }
    o.harf[q.dogru] = (o.harf[q.dogru] ?? 0) + 1
    if (!q.kok.includes('?')) {
      o.soruIsaretiYok++
      if (o.ornekler.soruIsaretiYok.length < 10)
        o.ornekler.soruIsaretiYok.push({ id: q.id, kok: q.kok })
    }
    if (betimleme(q.kok)) {
      o.betimlemeBitis++
      if (o.ornekler.betimleme.length < 10) o.ornekler.betimleme.push({ id: q.id, kok: q.kok })
    }
    if (BETIMLEME_ICINDE.test(q.kok)) o.betimlemeGecen++
    const pairs = benzerCiftler(q.siklar)
    if (pairs.length) {
      o.benzerCiftliSoru++
      o.benzerCift += pairs.length
      for (const [a, b] of pairs)
        if (o.ornekler.benzer.length < 10)
          o.ornekler.benzer.push({
            id: q.id,
            a: q.siklar.find((s) => s.key === a)!.md,
            b: q.siklar.find((s) => s.key === b)!.md
          })
    }
    if (q.siklar.some((s) => HEPSI.test(s.md))) o.hepsiHicbiri++
    const lens = q.siklar.map((s) => uzunluk(s.md))
    oran += Math.max(...lens) / Math.max(1, Math.min(...lens))
  }
  if (o.n) {
    o.dogruEnUzunOran = o.dogruEnUzun / o.n
    o.beklenenOran = beklenen / o.n
    o.ortUzunOrani = oran / o.n
  }
  return o
}

export function formatOlcum(o: Olcum, baslik = ''): string {
  const p = (n: number): string => `${((n / Math.max(1, o.n)) * 100).toFixed(1)}%`
  return [
    `${baslik ? baslik + ': ' : ''}${o.n} şıklı soru`,
    `  doğru = en uzun: ${o.dogruEnUzun} (${p(o.dogruEnUzun)}), şans düzeyi ${(o.beklenenOran * 100).toFixed(1)}%`,
    `  doğru en uzun ve ikinciden %${Math.round((BELIRGIN - 1) * 100)}+ uzun: ${o.belirginEnUzun} (${p(o.belirginEnUzun)})`,
    `  doğru şıkkın uzunluk sırası (1 = en uzun): ${Object.entries(o.sira)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join(' ')}`,
    `  en uzun / en kısa şık oranı ort.: ${o.ortUzunOrani.toFixed(2)}`,
    `  kökte soru işareti yok: ${o.soruIsaretiYok} (${p(o.soruIsaretiYok)}), "soruluyor/istenmektedir" bitişi: ${o.betimlemeBitis}, kökün içinde geçen: ${o.betimlemeGecen}`,
    `  benzer şık çifti (kelime Jaccard ≥ ${BENZERLIK}): ${o.benzerCiftliSoru} soruda ${o.benzerCift} çift`,
    `  hepsi/hiçbiri şıkkı: ${o.hepsiHicbiri}`,
    `  doğru harf: ${KEYS.map((k) => `${k} ${o.harf[k] ?? 0}`).join(', ')}`
  ].join('\n')
}

function fromQuestion(q: QuestionT): Olculen {
  return {
    id: q.id,
    kok: q.stem.md,
    siklar: q.choices.map((c) => ({ key: c.key, md: c.md })),
    ...(q.correct ? { dogru: q.correct } : {})
  }
}

function fromAny(x: unknown): Olculen[] {
  if (Array.isArray(x)) return x.flatMap(fromAny)
  if (!x || typeof x !== 'object') return []
  const o = x as Record<string, unknown>
  if (Array.isArray(o['questions'])) return (o['questions'] as QuestionT[]).map(fromQuestion)
  if (typeof o['kok'] === 'string' && Array.isArray(o['siklar']))
    return [
      {
        id: String(o['id']),
        kok: o['kok'],
        siklar: o['siklar'] as Olculen['siklar'],
        ...(typeof o['dogru'] === 'string' ? { dogru: o['dogru'] } : {})
      }
    ]
  if (o['stem'] && Array.isArray(o['choices'])) return [fromQuestion(o as unknown as QuestionT)]
  return []
}

export function olculenler(p: string): Olculen[] {
  const files = fs.statSync(p).isDirectory()
    ? fs
        .readdirSync(p)
        .filter((n) => n.endsWith('.json'))
        .sort()
        .map((n) => path.join(p, n))
    : [p]
  return files.flatMap((f) => fromAny(JSON.parse(fs.readFileSync(f, 'utf8'))))
}

export function birimOlculenleri(l: Loaded): Olculen[] {
  return loadOutputs(l).flatMap((u) => u.questions.map(fromQuestion))
}

export function secenekDir(l: Loaded): string {
  return path.join(l.buildDir, 'secenek')
}

export interface Oge {
  id: string
  tip: string
  kok: string
  siklar: { key: string; md: string }[]
  dogru: string
  celdiriciler: Record<string, string>
  cozum: string
  kaynak: { sayfa: [number, number]; alinti: string }
  ek?: string[]
}

export function donmus(q: QuestionT): boolean {
  return q.kind === 'isaretleme' || q.choices.some((c) => c.box || c.imageRef || c.alt)
}

export function toOge(q: QuestionT): Oge {
  const ek: string[] = []
  if (q.stem.table) ek.push('tablo')
  if (q.stem.imageRef) ek.push('gorsel')
  if (donmus(q)) ek.push('sabit-siklar')
  return {
    id: q.id,
    tip: q.kind,
    kok: q.stem.md,
    siklar: q.choices.map((c) => ({ key: c.key, md: c.md })),
    dogru: q.correct ?? '',
    celdiriciler: { ...q.distractors } as Record<string, string>,
    cozum: q.solution
      .flatMap((b) => ('md' in b ? [b.md] : []))
      .join(' ')
      .trim(),
    kaynak: { sayfa: q.source.pages, alinti: q.source.quote },
    ...(ek.length ? { ek } : {})
  }
}

export const SECENEK_KURALLARI = [
  `Kök kuralları:`,
  `- Kök kendi başına net bir soru cümlesiyle biter: "…hangisidir?", "…nedir?", "…kaçtır?", "…ne olur?", "…hangisi değildir?". Şıklar gizlenip yalnız kök okunduğunda ne sorulduğu tam anlaşılmalı.`,
  `- Kök betimleme olamaz. "…uzmanlık alanı ve kullandığı madde soruluyor.", "…istenmektedir." gibi bitişler yasak; soruyu doğrudan sor ("…ilk kez kullanan hekim kimdir?").`,
  `- Tek kökte tek şey sor. Kök iki ayrı bilgiyi istiyorsa ve şıklar ikisini birlikte veriyorsa, soruyu ikisini birlikte isteyen tek bir soru cümlesine çevir ("Hangi uzmanlık alanından hekim hangi maddeyi kullanmıştır?").`,
  `- Vaka kılıfını, verilen değerleri, tabloya ya da görsele yapılan atfı koru; kökte cevabı ele veren kelime (doğru şıkta geçen ayırt edici terim) olmasın.`,
  ``,
  `Doğru şık kuralları:`,
  `- Doğru şıkkın ANLAMI ve doğruluğu değişmez; dayanak kaynak.alinti ve cozum alanıdır. Yalnız ifadesi kısaltılabilir ya da diğer şıklarla aynı kalıba sokulabilir. Kaynakta olmayan bilgi ekleme, kaynaktaki bilgiyi çıkarıp cevabı yanlış ya da eksik yapma.`,
  ``,
  `Şık kuralları:`,
  `- Bütün şıklar aynı dilbilgisel kalıpta (hepsi isim öbeği ya da hepsi aynı yapıda cümle) ve benzer uzunlukta olur.`,
  `- Doğru şık en uzun şık olmamalı. Parti genelinde doğru şık uzunluk sırasında rastgele bir konumda dursun (bazen en kısa, bazen ortada, ara sıra en uzun). En uzun şık en kısanın 1,5 katını geçmesin; uzun bir doğru şıkkı kısalt ya da çeldiricileri aynı ayrıntı düzeyine getir.`,
  `- Her çeldirici bu alanda akla yatkın, gerçek bir kavramdır: aynı sınıftan bir ilaç, gerçek bir mekanizma, yakın bir değer ya da doz, komşu bir yapı. Uydurma terim, saçma ya da konuyla ilgisiz şık yazma; uzman bir okur çeldiriciyi ilk bakışta eleyememeli.`,
  `- İki şık birbirinin eş anlamlısı, yeniden ifadesi ya da neredeyse aynısı olamaz; her şık ayrı bir cevaptır.`,
  `- "Hepsi", "hiçbiri", "yukarıdakilerin tümü" gibi şık yazma.`,
  `- Bir şık başka bir çeldiriciyle birlikte doğruyu kesin olarak ele vermemeli (ör. birbirinin tam tersi iki şıktan biri doğru).`,
  ``,
  `Harf ve açıklama kuralları:`,
  `- Doğru şıkkın harfini değiştirebilirsin; parti genelinde doğru harfler A-E arasında yaklaşık eşit dağılsın. Harf değişince şıkları yeniden sırala ve çeldirici açıklamalarını yeni harflere taşı.`,
  `- Şık sayısı ve anahtarlar aynı kalır (girdide A-E ise çıktıda da A-E, sırasıyla).`,
  `- celdiriciler: doğru dışındaki her harf için, o şıkkın neden yanlış olduğunu yeni şık metnine göre bir iki cümleyle açıkla. Doğru harf için açıklama yazma.`,
  `- ek alanında "sabit-siklar" varsa (işaretleme sorusu) şıklar görseldeki işaretli bölgelere bağlıdır: şıkları, anahtarları ve doğru harfi aynen bırak; yalnız kökü ve gerekirse çeldirici açıklamalarını düzelt.`
].join('\n')

export function secenekIstemi(batch: string, out: string): string {
  return [
    `Görev: ${batch} dosyasındaki anestezi uzmanlık sınavı sorularının kökünü ve şıklarını denetle, gerekirse yeniden yaz.`,
    `Her soruyu kendin oku ve karar ver; script, anahtar kelime kuralı ya da alt ajan kullanma. Kitap bilgisi için kaynak.alinti ve cozum alanına dayan.`,
    `Bilinen sorunlar: doğru şık çoğu soruda en uzun ve en ayrıntılı şık (öğrenci "en uzunu işaretle" diyerek çözebiliyor); bazı çeldiriciler uydurma ya da saçma; bazı sorularda iki şık birbirinin neredeyse aynısı; bazı kökler soru değil betimleme, şıklar olmadan ne sorulduğu anlaşılmıyor.`,
    '',
    SECENEK_KURALLARI,
    '',
    `Çıktı: ${out} dosyasına, girişteki her soru için bir öğe içeren bir JSON dizisi yaz:`,
    `[{"id": "...", "kok": "...", "siklar": [{"key": "A", "md": "..."}, ...], "dogru": "C", "celdiriciler": {"A": "...", "B": "...", "D": "...", "E": "..."}, "degisti": true, "not": "isteğe bağlı kısa gerekçe"}]`,
    `Soru zaten kurallara uyuyorsa degisti false yaz ve kok, siklar, dogru, celdiriciler alanlarını girdideki gibi bırak. Hiçbir soruyu atlama, id'leri değiştirme, tip/cozum/kaynak/ek alanlarını çıktıya yazma.`,
    `Bitirince partiyi baştan tara: doğru şık kaç soruda en uzun, doğru harfler dengeli mi, iki şık birbirine benziyor mu, her kök "?" ile bitiyor mu.`
  ].join('\n')
}

export function exportSecenek(l: Loaded, size = PARTI): string[] {
  const items = loadOutputs(l)
    .flatMap((u) => u.questions)
    .filter(
      (q) =>
        (q.kind === 'coktan-secmeli' || q.kind === 'isaretleme') &&
        q.choices.length >= 2 &&
        q.correct
    )
    .map(toOge)
  const dir = secenekDir(l)
  fs.rmSync(path.join(dir, 'in'), { recursive: true, force: true })
  fs.mkdirSync(path.join(dir, 'in'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true })
  const files: string[] = []
  for (let i = 0; i * size < items.length; i++) {
    const n = String(i + 1).padStart(3, '0')
    const f = path.join(dir, 'in', `${n}.json`)
    fs.writeFileSync(f, JSON.stringify(items.slice(i * size, (i + 1) * size), null, 1))
    files.push(f)
  }
  fs.writeFileSync(
    path.join(dir, 'istem.md'),
    `${secenekIstemi('build/secenek/in/NNN.json', 'build/secenek/out/NNN.json')}\n`
  )
  return files
}

export const Cikti = z.object({
  id: z.string().min(1),
  kok: z.string().min(1),
  siklar: z
    .array(z.object({ key: ChoiceKey, md: z.string().min(1) }))
    .min(2)
    .max(5),
  dogru: ChoiceKey,
  celdiriciler: z.partialRecord(ChoiceKey, z.string().min(1)),
  degisti: z.boolean(),
  not: z.string().optional()
})
export type CiktiT = z.infer<typeof Cikti>

export function readCikti(dir: string): Map<string, CiktiT> {
  const map = new Map<string, CiktiT>()
  if (!fs.existsSync(dir)) return map
  for (const n of fs
    .readdirSync(dir)
    .filter((x) => x.endsWith('.json'))
    .sort()) {
    const v = z.array(Cikti).safeParse(JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')))
    if (!v.success)
      throw new Error(
        `${n}: ${v.error.issues
          .slice(0, 5)
          .map((i) => i.path.join('.') + ' ' + i.message)
          .join('; ')}`
      )
    for (const r of v.data) {
      if (map.has(r.id)) throw new Error(`${n}: ${r.id} iki kez`)
      map.set(r.id, r)
    }
  }
  return map
}

const compact = (s: string): string => [...tokens(s)].join(' ')

export interface Denetim {
  hatalar: string[]
  uyarilar: { kod: string; mesaj: string }[]
}

export function denetle(q: QuestionT, c: CiktiT): Denetim {
  const hatalar: string[] = []
  const uyarilar: Denetim['uyarilar'] = []
  const keys = c.siklar.map((s) => s.key)
  const want = KEYS.slice(0, q.choices.length)
  if (keys.join('') !== want.join(''))
    hatalar.push(`anahtarlar ${keys.join('')} olmalı ${want.join('')}`)
  if (keys.filter((k) => k === c.dogru).length !== 1)
    hatalar.push(`doğru ${c.dogru} şıklarda tam bir kez geçmeli`)
  const need = keys.filter((k) => k !== c.dogru).sort()
  const have = Object.keys(c.celdiriciler).sort()
  if (need.join('') !== have.join(''))
    hatalar.push(`çeldirici açıklamaları ${have.join('')} olmalı ${need.join('')}`)
  const seen = new Set<string>()
  for (const s of c.siklar) {
    const k = compact(s.md)
    if (seen.has(k)) hatalar.push(`aynı şık metni iki kez: "${s.md}"`)
    seen.add(k)
  }
  if (donmus(q)) {
    const same =
      c.dogru === q.correct &&
      c.siklar.length === q.choices.length &&
      c.siklar.every((s, i) => s.key === q.choices[i]!.key && s.md === q.choices[i]!.md)
    if (!same) hatalar.push('sabit şıklar (işaretleme) değiştirilmiş')
  }
  if (sira(c.siklar, c.dogru) === 1 && belirginEnUzun(c.siklar, c.dogru))
    uyarilar.push({ kod: 'uzun', mesaj: `doğru şık en uzun ve ikinciden %30+ uzun` })
  if (!c.kok.includes('?')) uyarilar.push({ kod: 'kok', mesaj: 'kökte soru işareti yok' })
  if (BETIMLEME_ICINDE.test(c.kok))
    uyarilar.push({ kod: 'betimleme', mesaj: 'kökte "soruluyor/istenmektedir" kalıbı var' })
  for (const [a, b, v] of benzerCiftler(c.siklar))
    uyarilar.push({ kod: 'benzer', mesaj: `${a}≈${b} (${v.toFixed(2)})` })
  if (c.siklar.some((s) => HEPSI.test(s.md)))
    uyarilar.push({ kod: 'hepsi', mesaj: 'hepsi/hiçbiri şıkkı' })
  const yeni = c.siklar.find((s) => s.key === c.dogru)
  const eski = q.choices.find((s) => s.key === q.correct)
  if (yeni && eski) {
    const pool = kokler(
      [
        eski.md,
        q.source.quote,
        ...q.solution.flatMap((b) => ('md' in b ? [b.md] : [])),
        q.stem.md
      ].join(' ')
    )
    const t = kokler(yeni.md)
    const hit = [...t].filter((x) => pool.has(x)).length / Math.max(1, t.size)
    if (hit < 0.5)
      uyarilar.push({
        kod: 'anlam',
        mesaj: `doğru şık kaynağa uzak (%${Math.round(hit * 100)}): "${eski.md}" → "${yeni.md}"`
      })
  }
  if (c.dogru !== q.correct) {
    const sol = q.solution.flatMap((b) => ('md' in b ? [b.md] : [])).join(' ')
    if (/\b[A-E]\)|şıkk/u.test(sol))
      uyarilar.push({ kod: 'cozum-harf', mesaj: 'çözüm metni şık harfine atıf yapıyor' })
  }
  return { hatalar, uyarilar }
}

export function yenile(q: QuestionT, c: CiktiT): QuestionT {
  const stem = { ...q.stem, md: c.kok.trim() }
  const choices = donmus(q) ? q.choices : c.siklar.map((s) => ({ key: s.key, md: s.md.trim() }))
  const distractors: Record<string, string> = {}
  for (const k of KEYS) {
    const v = c.celdiriciler[k]
    if (v && k !== c.dogru) distractors[k] = v.trim()
  }
  const solution = q.solution.map((b) =>
    'md' in b
      ? { ...b, md: b.md.replace(CEVAP, (_m, w: string, sp: string) => w + sp + c.dogru) }
      : b
  )
  return fixAnswerRefs({
    ...q,
    stem,
    solution,
    choices,
    correct: c.dogru,
    distractors: distractors as QuestionT['distractors'],
    vurgu: q.vurgu.filter((v) => stem.md.includes(v))
  })
}

export interface Uygulama {
  toplam: number
  cikti: number
  degisen: number
  ayni: number
  bilinmeyen: string[]
  hatalar: { id: string; mesaj: string }[]
  uyarilar: { id: string; kod: string; mesaj: string }[]
  once: Olculen[]
  sonra: Olculen[]
}

export function uygula(l: Loaded, map: Map<string, CiktiT>, dryRun = false): Uygulama {
  const r: Uygulama = {
    toplam: 0,
    cikti: 0,
    degisen: 0,
    ayni: 0,
    bilinmeyen: [],
    hatalar: [],
    uyarilar: [],
    once: [],
    sonra: []
  }
  const seen = new Set<string>()
  const dir = unitsDir(l)
  const writes: [string, UnitOutput][] = []
  const files = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((n) => n.endsWith('.json'))
        .sort()
    : []
  for (const n of files) {
    const f = path.join(dir, n)
    const u = JSON.parse(fs.readFileSync(f, 'utf8')) as UnitOutput
    let dirty = false
    u.questions = u.questions.map((q) => {
      r.toplam++
      seen.add(q.id)
      const c = map.get(q.id)
      if (!c) return q
      r.cikti++
      if (!q.correct || q.choices.length < 2) {
        r.hatalar.push({ id: q.id, mesaj: `şıksız soru (${q.kind})` })
        return q
      }
      if (!c.degisti) {
        r.ayni++
        return q
      }
      const d = denetle(q, c)
      for (const m of d.hatalar) r.hatalar.push({ id: q.id, mesaj: m })
      for (const w of d.uyarilar) r.uyarilar.push({ id: q.id, ...w })
      if (d.hatalar.length) return q
      const y = yenile(q, c)
      r.once.push(fromQuestion(q))
      r.sonra.push(fromQuestion(y))
      r.degisen++
      dirty = true
      return y
    })
    if (dirty) writes.push([f, u])
  }
  for (const id of map.keys()) if (!seen.has(id)) r.bilinmeyen.push(id)
  if (!dryRun && r.hatalar.length === 0 && r.bilinmeyen.length === 0)
    for (const [f, u] of writes) fs.writeFileSync(f, JSON.stringify(u, null, 1))
  return r
}

export function formatUygula(r: Uygulama, dryRun: boolean): string {
  const yazildi = !dryRun && r.hatalar.length === 0 && r.bilinmeyen.length === 0
  const kodlar: Record<string, number> = {}
  for (const w of r.uyarilar) kodlar[w.kod] = (kodlar[w.kod] ?? 0) + 1
  const lines = [
    `${r.toplam} soru, ${r.cikti} çıktı: ${r.degisen} değişti, ${r.ayni} aynı kaldı — ${yazildi ? 'yazıldı' : dryRun ? 'deneme, yazılmadı' : 'HATA, yazılmadı'}`,
    `uyarı: ${
      Object.entries(kodlar)
        .sort()
        .map(([k, v]) => `${k} ${v}`)
        .join(', ') || 'yok'
    }`
  ]
  for (const w of r.uyarilar.slice(0, 10)) lines.push(`  UYARI ${w.id} ${w.kod}: ${w.mesaj}`)
  for (const e of r.hatalar.slice(0, 20)) lines.push(`  HATA ${e.id}: ${e.mesaj}`)
  if (r.bilinmeyen.length)
    lines.push(`bilinmeyen ${r.bilinmeyen.length}: ${r.bilinmeyen.slice(0, 5).join(', ')}`)
  if (r.degisen) {
    lines.push(formatOlcum(olc(r.once), 'değişenler önce'))
    lines.push(formatOlcum(olc(r.sonra), 'değişenler sonra'))
  }
  return lines.join('\n')
}
