import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import {
  Question,
  type Question as QuestionT,
  type SolutionBlock,
  type Box
} from '../../../src/shared/schema/question.ts'
import { quoteFound } from './text.ts'
import { ZORLUK_OLCUTU } from './zorluk.ts'
import type { Loaded } from './rules.ts'
import { rangeText, toShown, unitText, type Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import {
  cleanPartials,
  loadCheckpoint,
  saveCheckpoint,
  writeAtomic,
  type Checkpoint
} from './checkpoint.ts'
import { canonical, sha256 } from './hash.ts'
import { consumeFlags, flagNote } from './flags.ts'
import { asTur, type Tur } from './tur.ts'
import { findRow, labelIndex, matchLabel, resolveMasks, toTable, type LabelRow } from './etiket.ts'

const Key = z.enum(['A', 'B', 'C', 'D', 'E'])

const GenTable = z.object({
  baslik: z.string().optional(),
  basliklar: z.array(z.string()).min(1),
  satirlar: z.array(z.array(z.string())).min(1),
  satirBasligi: z.boolean().optional()
})

export const Generated = z.object({
  sorular: z.array(
    z.object({
      alinti: z.string(),
      gorsel: z.string().optional(),
      gorselAlt: z.string().optional(),
      cozumGorseli: z.string().optional(),
      cozumGorseliAlt: z.string().optional(),
      tablo: GenTable.optional(),
      cozumTablosu: GenTable.optional(),
      maskeler: z.array(z.string()).optional(),
      isaretler: z.array(z.object({ anahtar: Key, etiket: z.string() })).optional(),
      sayfa: z.object({ baslangic: z.number().int(), bitis: z.number().int() }),
      kavram: z.string(),
      kok: z.string(),
      tip: z.enum(['coktan-secmeli', 'acik-uclu', 'isaretleme']).optional(),
      vurgu: z.array(z.string()).optional(),
      siklar: z.array(z.object({ anahtar: Key, metin: z.string() })).default([]),
      dogru: z.preprocess((v) => (v === '' ? undefined : v), Key.optional()),
      beklenenCevap: z.string().optional(),
      celdiriciler: z.array(z.object({ anahtar: Key, aciklama: z.string() })).default([]),
      cozum: z.array(z.object({ tur: z.enum(['text', 'hint']), metin: z.string() })),
      zorluk: z.enum(['kolay', 'orta', 'zor']),
      etiketler: z.array(z.string())
    })
  )
})

type Generated = z.infer<typeof Generated>
type GenQ = Generated['sorular'][number]

export const PRICES: Record<string, [number, number]> = {
  'claude-opus-5': [5, 25],
  'claude-sonnet-5': [2, 10],
  'claude-haiku-4-5': [1, 5]
}

export interface RunOptions {
  model: string
  maxUsd: number
  limit?: number
  chapter?: number
  dryRun: boolean
}

export interface UnitOutput {
  unitId: string
  hash: string
  pages: [number, number]
  questions: QuestionT[]
  dropped: { kok: string; reason: string }[]
}

const TUR_ISTEMI: Record<Tur, string> = {
  metin: `Bu turda şekil ve tablo görmüyorsun: şekle, tabloya ya da görsele atıf yapan soru yazma.`,
  gorsel: `Bu turda soru şeklin ya da tablonun kendisinden çıkar: verilen görseli okumayı sına — neyi gösterdiğini, hangi değerin hangi durumu işaret ettiğini, eğrinin nereye gittiğini sor. Kullandığın görselin dosya adını gorsel alanına yaz; görseli anlatarak kökün içinde tekrar etme. gorselAlt alanına görseli görmeyen biri için bir iki cümlelik tarafsız betimleme yaz (cevabı ele vermeden).`,
  tablo: [
    `Bu turda soru kitaptaki bir tablodan çıkar. Her tablo için sayfa görüntüsünün yolu ve OCR metni verilir; OCR bozuk olabilir, doğrusu görüntüdedir.`,
    `Önce görüntüyü aç ve tabloyu satır satır, sütun sütun birebir aktar: tablo.basliklar sütun başlıkları, tablo.satirlar her satırın hücreleri (başlıklarla aynı sayıda), tablo.baslik tablonun adı ("Tablo 3-3 ..."), ilk sütun satır başlığıysa satirBasligi true. Hücreleri kitaptaki gibi yaz; kısaltma, çeviri, düzeltme yapma. Uydurma hücre içeren tablo çöpe gider.`,
    `Tablo kökte verilir; kök tabloyu yeniden anlatmaz, tabloya dayanan klinik bir durum kurar. Cevap tablodan tek bir hücreyi okumak kadar kolay olmamalı: iki hücreyi karşılaştırmayı, bir değeri hastaya uygulamayı ya da tablodaki örüntüden çıkarım yapmayı gerektirsin.`,
    `Tablo büyükse soruyla ilgili satır ve sütunları eksiksiz aktar, ilgisizleri bırakabilirsin; aktardığın her hücre kitaptakiyle aynı olmalı.`,
    `alinti yine sayfa metninden birebir olmalı (tablonun başlığı ya da tabloyu anlatan cümle olabilir).`
  ].join('\n'),
  etiket: [
    `Bu turda soru etiketli şekillerden çıkar. Her şekil için görselin yolu ve üzerindeki etiketlerin listesi verilir. Görseli aç, etiketlerin neyi gösterdiğini gör.`,
    `İki biçimden birini yaz:`,
    `1) İşaretleme: tip "isaretleme", gorsel şeklin dosya adı, isaretler alanında 3-5 etiket (anahtar harfi ve etiket metni listedeki gibi, birebir). Kök sorulan yapının adını ya da işlevini söyler ("... hangisidir? Görselde işaretleyin."), öğrenci görsel üstündeki kutulardan birini seçer. siklar boş kalır. dogru doğru etiketin harfi. celdiriciler her yanlış etiket için o yapının ne olduğunu ve işlevini tek cümleyle söyler.`,
    `2) Maskeli kök: maskeler alanına tek bir etiket metni yaz (listedeki gibi, birebir); o etiket görselde kapatılır. Kök "görselde işaretli yapı" der, kapatılan etiketin adını ya da açık bir eşanlamlısını asla anmaz. Şıklar metindir, siklar alanında.`,
    `Kutuları sen yazmazsın; etiket metninden bulunur. Listede olmayan ya da birebir yazılmamış etiket soruyu düşürür.`,
    `gorselAlt alanına şekli görmeyen biri için tarafsız betimleme yaz; kapatılan ya da sorulan etiketin adını betimlemede kullanma.`
  ].join('\n')
}

export function systemPrompt(l: Loaded, turArg: Tur | boolean = 'metin'): string {
  const tur = asTur(turArg)
  const u = l.rules.uretim
  const s = l.rules.stil
  const keys = ['A', 'B', 'C', 'D', 'E'].slice(0, u.sikSayisi).join(', ')
  const metinBloklari = u.cozumBloklari.filter((b) => b === 'text' || b === 'hint')
  const ekBloklar = [
    u.cozumBloklari.includes('image')
      ? `Çözümde bir şekil gerçekten açıklayıcıysa dosya adını cozumGorseli alanına, betimlemesini cozumGorseliAlt alanına yaz.`
      : '',
    u.cozumBloklari.includes('table')
      ? `Çözümde kitaptaki bir tablo cevabı destekliyorsa cozumTablosu alanına tablo ile aynı biçimde birebir aktar (baslik, basliklar, satirlar).`
      : ''
  ]
  const yasak = u.yasakli.filter((y) => !(tur !== 'metin' && (y === 'image' || y === 'table')))
  return [
    `Sen uzmanlık sınavı sorusu yazan bir editörsün. Kaynak: "${l.rules.module.ad}".`,
    `Ölçüt şu: soruyu bir uzmana sorsan onu gerçekten sınamalı. Metni okuyup okumadığını değil, bilgiyi kullanabildiğini ölç.`,
    `Bu yüzden: kökte kısa bir klinik durum ya da bir karar anı kur, sonra ne yapılacağını, neden olduğunu, hangi mekanizmanın işlediğini sor. "Parçaya göre aşağıdakilerden hangisi doğrudur" tarzı tanıma sorusu yazma; cümleyi şıkka çevirip sorma; tanım ezberi sorma.`,
    `Çeldiriciler gerçek klinik yanılgılar olsun — uzmanın da bir an duraksayacağı, yanlış ama akla yatkın seçenekler. Bariz saçma şık koyma, "hiçbiri", "hepsi" yazma.`,
    `Alıntı sorunun dayanağıdır, gövdesi değil: soru alıntının söylediğini uygulatmalı, alıntıyı tekrar ettirmemeli.`,
    `Sana bir kitap parçası verilecek; sayfalar "[[sayfa N]]" işaretiyle ayrılmış. Yalnız bu parçadaki bilgiden soru üret.`,
    `Sıra kesin: önce parçadan birebir bir alıntı seç (alinti, 15-60 kelime, metinde geçtiği gibi, düzeltme yapma), sonra o alıntıdan soruyu yaz. Alıntısı metinde bulunmayan soru çöpe gider.`,
    `sayfa.baslangic ve sayfa.bitis alıntının geçtiği [[sayfa N]] numaralarıdır.`,
    `Parça başına ${u.parcaBasinaSoru} soru. Her soruda ${u.sikSayisi} şık (${keys}); tek doğru. Doğru şıkkın harfini eşit dağıt: ${keys} harflerinin her biri en az bir kez doğru olsun, hiçbiri üç kereden fazla olmasın.`,
    `celdiriciler: her yanlış şık için ayrı bir açıklama — neden yanlış olduğu, tek cümle. Doğru şık için açıklama yazma.`,
    `cozum: sıralı bloklar; türler ${metinBloklari.join(', ')}. İlk blok text türünde, doğru cevabı kaynağa dayanarak açıklar.`,
    ...ekBloklar,
    `zorluk alanı için ölçüt:
${ZORLUK_OLCUTU}`,
    `kavram: sorunun sınadığı tek kavram, 2-5 kelime. etiketler: 1-4 kısa konu etiketi.`,
    `Çözümde ve çeldirici açıklamalarında şık harfi anma ("doğru cevap A'dır" yazma); bilgiyi anlat.`,
    TUR_ISTEMI[tur],
    yasak.length ? `Yasak: ${yasak.join(', ')}.` : '',
    tur !== 'metin' ? `Her görselli soruda gorselAlt zorunlu.` : '',
    `Her soru şıklı olmak zorunda değil. Cevabı tek bir kavram, değer ya da kısa bir gerekçe olan soruyu açık uçlu yaz: tip "acik-uclu", siklar boş, dogru yok, beklenenCevap alanında beklenen cevabı bir iki cümleyle yaz. Şık uydurmak zorunda kaldığını hissettiğin her yerde açık uçlu yaz.`,
    `vurgu: kökteki en ayırt edici 1-3 ifade, her biri en çok üç kelime ve kökte harfiyen geçen. Fiil ya da fiilden türemiş kelime seçme; terim, değer ve sayı seç.`,
    s.ton ? `Ton: ${s.ton}.` : '',
    s.uzunluk ? `Uzunluk: ${s.uzunluk}.` : '',
    `Daha önce üretilmiş kökler listesi verilirse aynı bilgiyi ikinci kez sorma.`,
    `Türkçe yaz. Markdown yalnız vurgu için; başlık ve liste kullanma.`
  ]
    .filter(Boolean)
    .join('\n')
}

export function userPrompt(unit: Unit, text: string, previous: string[]): string {
  const prev = previous.length
    ? `\n\nDaha önce üretilmiş kökler (tekrar etme):\n${previous.map((s) => '- ' + s).join('\n')}`
    : ''
  return `Bölüm ${unit.chapter}: ${unit.title}\nPDF sayfaları ${unit.pages[0]}-${unit.pages[1]}\n\n<parca>\n${text}\n</parca>${prev}`
}

export function assetRef(name: string): string {
  return 'assets/img/' + path.basename(name)
}

export function figuresDir(l: Loaded): string {
  return path.join(l.buildDir, 'figures')
}

export function tablesDir(l: Loaded): string {
  return path.join(l.buildDir, 'tbl')
}

export function moduleDir(l: Loaded): string {
  return path.join(l.root, 'modules', l.rules.module.id)
}

export function assetSource(l: Loaded, ref: string): string {
  const [, kind] = ref.split('/')
  const base = path.basename(ref)
  if (kind === 'tbl') return path.join(tablesDir(l), base)
  if (kind === 'kaynak') return path.join(moduleDir(l), 'assets', 'kaynak', base)
  return path.join(figuresDir(l), base)
}

export function imageRefs(q: QuestionT): string[] {
  const refs: string[] = []
  if (q.stem.imageRef) refs.push(q.stem.imageRef)
  for (const ch of q.choices) if (ch.imageRef) refs.push(ch.imageRef)
  for (const b of q.solution) if (b.type === 'image') refs.push(b.ref)
  return [...new Set(refs)]
}

function slug(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function findPages(c: Corpus, unit: Unit, quote: string): [number, number] | null {
  const a = Math.max(1, unit.pages[0] - 1)
  const b = unit.pages[1] + 1
  for (let i = a; i <= b; i++) if (quoteFound(quote, rangeText(c, i, i))) return [i, i]
  for (let i = a; i < b; i++) if (quoteFound(quote, rangeText(c, i, i + 1))) return [i, i + 1]
  return null
}

type Resolved =
  | { ok: true; masks?: QuestionT['stem']['masks']; boxes?: Map<string, Box> }
  | { ok: false; reason: string }

export function resolveBoxes(g: GenQ, labels: LabelRow[]): Resolved {
  const out: Resolved = { ok: true }
  if (g.maskeler?.length) {
    const r = resolveMasks(labels, g.gorsel, g.maskeler, g.kok)
    if (!r.ok) return r
    out.masks = r.masks
  }
  if (g.tip === 'isaretleme') {
    if (!g.gorsel) return { ok: false, reason: 'işaretleme sorusunda gorsel yok' }
    const row = findRow(labels, g.gorsel)
    if (!row)
      return { ok: false, reason: `etiket dizininde görsel yok: ${path.basename(g.gorsel)}` }
    const isaretler = g.isaretler ?? []
    if (isaretler.length < 2)
      return { ok: false, reason: 'işaretleme sorusunda en az iki işaret gerek' }
    out.boxes = new Map()
    for (const i of isaretler) {
      const hit = matchLabel(row, i.etiket)
      if (!hit.ok) return hit
      out.boxes.set(i.anahtar, hit.kutu)
    }
    const seen = new Set([...out.boxes.values()].map((b) => b.join(',')))
    if (seen.size !== out.boxes.size) return { ok: false, reason: 'iki işaret aynı kutuya düştü' }
  }
  return out
}

export function mapUnit(
  l: Loaded,
  c: Corpus,
  unit: Unit,
  gen: Generated,
  labels: LabelRow[] = labelIndex(l)
): { questions: QuestionT[]; dropped: { kok: string; reason: string }[]; badQuotes: string[] } {
  const questions: QuestionT[] = []
  const dropped: { kok: string; reason: string }[] = []
  const badQuotes: string[] = []
  const keys = ['A', 'B', 'C', 'D', 'E'].slice(0, l.rules.uretim.sikSayisi)
  let slot = parseInt(unit.hash.slice(0, 4), 16) % keys.length
  for (const g of gen.sorular) {
    const found = findPages(c, unit, g.alinti)
    if (!found) {
      badQuotes.push(g.alinti)
      dropped.push({ kok: g.kok, reason: 'alıntı metinde yok' })
      continue
    }
    const r = resolveBoxes(g, labels)
    if (!r.ok) {
      dropped.push({ kok: g.kok, reason: r.reason })
      continue
    }
    const q = fixAnswerRefs(balance(toQuestion(l, c, unit, g, found, r), keys[slot % keys.length]!))
    slot++
    const v = Question.safeParse(q)
    if (!v.success) {
      dropped.push({
        kok: g.kok,
        reason: v.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; ')
      })
      continue
    }
    questions.push(v.data)
  }
  return { questions, dropped, badQuotes }
}

const LETTER_REF =
  /(ceva(?:p|bı)\s+|şık\s+|seçenek\s+)([A-E])|([A-E])(?=['’]?\s*(?:şıkkı|seçeneği|şıkkında|seçeneğinde))/g

function swapLetters(text: string, a: string, b: string): string {
  return text.replace(
    LETTER_REF,
    (m, pre: string | undefined, k1: string | undefined, k2: string | undefined) => {
      const k = k1 ?? k2 ?? ''
      const to = k === a ? b : k === b ? a : k
      return (pre ?? '') + m.slice((pre ?? '').length).replace(k, to)
    }
  )
}

const ANSWER_REF = /(\bceva(?:p|b\u0131|b\u0131m\u0131z)?\s+|\byan\u0131t\s+)([A-E])\b/g

export function fixAnswerRefs(q: QuestionT): QuestionT {
  if (!q.correct) return q
  const fix = (t: string): string => t.replace(ANSWER_REF, (_m, pre: string) => pre + q.correct)
  const solution: SolutionBlock[] = q.solution.map((b) => ('md' in b ? { ...b, md: fix(b.md) } : b))
  const distractors: Record<string, string> = {}
  for (const [k, v] of Object.entries(q.distractors)) distractors[k] = fix(v)
  return {
    ...q,
    solution,
    distractors: distractors as QuestionT['distractors'],
    contentHash: sha256(
      canonical({ stem: q.stem, choices: q.choices, correct: q.correct, solution })
    )
  }
}

function balance(q: QuestionT, target: string): QuestionT {
  if (!q.correct || q.correct === target || !q.choices.some((ch) => ch.key === target)) return q
  const from = q.correct
  const choices = q.choices.map((ch) => {
    if (ch.key === from) return { ...q.choices.find((x) => x.key === target)!, key: ch.key }
    if (ch.key === target) return { ...q.choices.find((x) => x.key === from)!, key: ch.key }
    return ch
  })
  const distractors: Record<string, string> = {}
  for (const [k, v] of Object.entries(q.distractors))
    distractors[k === target ? from : k] = swapLetters(v, from, target)
  const solution: SolutionBlock[] = q.solution.map((b) =>
    'md' in b ? { ...b, md: swapLetters(b.md, from, target) } : b
  )
  return {
    ...q,
    choices,
    solution,
    correct: target as QuestionT['correct'],
    distractors: distractors as QuestionT['distractors'],
    contentHash: sha256(canonical({ stem: q.stem, choices, correct: target, solution }))
  }
}

function toQuestion(
  l: Loaded,
  c: Corpus,
  unit: Unit,
  g: GenQ,
  found: [number, number],
  r: Resolved = { ok: true }
): QuestionT {
  const stem: QuestionT['stem'] = { md: g.kok.trim() }
  if (g.gorsel) {
    stem.imageRef = assetRef(g.gorsel)
    if (g.gorselAlt?.trim()) stem.alt = g.gorselAlt.trim()
  }
  if (g.tablo) stem.table = toTable(g.tablo)
  if (r.ok && r.masks?.length) stem.masks = r.masks
  const marking = g.tip === 'isaretleme' && r.ok && !!r.boxes
  const choices: QuestionT['choices'] = marking
    ? (g.isaretler ?? []).map((i) => ({
        key: i.anahtar,
        md: i.etiket.trim(),
        box: (r.ok && r.boxes?.get(i.anahtar)) || undefined
      }))
    : g.siklar.map((s) => ({ key: s.anahtar, md: s.metin.trim() }))
  const solution: SolutionBlock[] = g.cozum.map((b) => ({ type: b.tur, md: b.metin.trim() }))
  if (g.cozumGorseli) {
    const alt = g.cozumGorseliAlt?.trim()
    solution.push({ type: 'image', ref: assetRef(g.cozumGorseli), ...(alt ? { alt } : {}) })
  }
  if (g.cozumTablosu) solution.push({ type: 'table', ...toTable(g.cozumTablosu) })
  const chapter = c.chapters.find((x) => x.chapter === unit.chapter)
  const pages: [number, number] = [toShown(l, c, found[0]), toShown(l, c, found[1])]
  const open = !marking && (g.tip === 'acik-uclu' || !g.dogru || choices.length < 2)
  return {
    id: `${l.rules.module.id}-${sha256(unit.hash + '\n' + stem.md).slice(0, 12)}`,
    conceptId: slug(g.kavram) || 'genel',
    stem,
    kind: open ? 'acik-uclu' : marking ? 'isaretleme' : 'coktan-secmeli',
    choices: open ? [] : choices,
    correct: open ? undefined : g.dogru,
    beklenenCevap: open ? g.beklenenCevap?.trim() : undefined,
    distractors: open
      ? {}
      : (Object.fromEntries(
          g.celdiriciler
            .filter((d) => d.anahtar !== g.dogru)
            .map((d) => [d.anahtar, d.aciklama.trim()])
        ) as QuestionT['distractors']),
    solution,
    source: {
      file: c.file,
      pages,
      quote: g.alinti.trim(),
      chapter: chapter ? `${chapter.chapter} ${chapter.title}` : String(unit.chapter)
    },
    difficulty: g.zorluk,
    tags: g.etiketler.map((t) => t.trim()).filter(Boolean),
    vurgu: (g.vurgu ?? [])
      .map((v) => v.trim())
      .filter((v) => v && v.split(' ').length <= 3 && stem.md.includes(v))
      .slice(0, 3),
    contentHash: sha256(
      canonical({
        stem,
        choices: open ? [] : choices,
        correct: open ? undefined : g.dogru,
        solution
      })
    ),
    deleted: false
  }
}

function usdOf(model: string, input: number, cached: number, output: number): number {
  const p = PRICES[model] ?? PRICES['claude-opus-5']!
  return ((input + cached * 0.1) * p[0] + output * p[1]) / 1_000_000
}

export function unitsDir(l: Loaded): string {
  return path.join(l.buildDir, 'units')
}

export function loadOutputs(l: Loaded): UnitOutput[] {
  const dir = unitsDir(l)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')) as UnitOutput)
}

function select(plan: Plan, cp: Checkpoint, o: RunOptions): Unit[] {
  let units = plan.units.filter((u) => cp.units[u.hash]?.status !== 'done')
  if (o.chapter !== undefined) units = units.filter((u) => u.chapter === o.chapter)
  if (o.limit !== undefined) units = units.slice(0, o.limit)
  return units
}

export async function run(l: Loaded, c: Corpus, plan: Plan, o: RunOptions): Promise<Checkpoint> {
  const cp = loadCheckpoint(l, c.sha256)
  cleanPartials(unitsDir(l))
  const units = select(plan, cp, o)
  const system = systemPrompt(l)
  if (o.dryRun) {
    const first = units[0]
    const est = units.reduce((n, u) => n + u.chars / 3.2 + 1500, 0)
    const out = units.length * l.rules.uretim.parcaBasinaSoru * 450
    console.log(
      `bekleyen birim: ${units.length}, tahmini giriş ~${Math.round(est)} token, çıkış ~${Math.round(out)} token, ~$${usdOf(o.model, est, 0, out).toFixed(2)} (${o.model})`
    )
    if (first)
      console.log(
        '\n--- system ---\n' +
          system +
          '\n\n--- user (ilk birim) ---\n' +
          (userPrompt(first, unitText(l, c, ...first.pages), []) + flagNote(l, first.unitId)).slice(
            0,
            3000
          ) +
          '\n...'
      )
    return cp
  }
  const client = new Anthropic()
  const previous: string[] = loadOutputs(l).flatMap((u) => u.questions.map((q) => q.stem.md))
  for (const unit of units) {
    if (cp.totals.usd >= o.maxUsd) {
      console.log(`tavan doldu: $${cp.totals.usd.toFixed(2)} >= $${o.maxUsd}`)
      break
    }
    const text = unitText(l, c, ...unit.pages)
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: userPrompt(unit, text, previous.slice(-200)) + flagNote(l, unit.unitId)
      }
    ]
    const state = cp.units[unit.hash] ?? {
      unitId: unit.unitId,
      hash: unit.hash,
      status: 'failed' as const,
      attempts: 0,
      questionIds: [],
      inputTokens: 0,
      outputTokens: 0,
      usd: 0
    }
    let questions: QuestionT[] = []
    const dropped: { kok: string; reason: string }[] = []
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        state.attempts++
        const res = await client.messages.parse({
          model: o.model,
          max_tokens: 16000,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          messages,
          output_config: { format: zodOutputFormat(Generated) }
        })
        const u = res.usage
        const cached = u.cache_read_input_tokens ?? 0
        const usd = usdOf(
          o.model,
          u.input_tokens + (u.cache_creation_input_tokens ?? 0),
          cached,
          u.output_tokens
        )
        state.inputTokens += u.input_tokens + cached
        state.outputTokens += u.output_tokens
        state.usd += usd
        cp.totals.inputTokens += u.input_tokens + cached
        cp.totals.outputTokens += u.output_tokens
        cp.totals.usd += usd
        if (res.stop_reason !== 'end_turn' || !res.parsed_output)
          throw new Error(`stop_reason=${res.stop_reason}`)
        const mapped = mapUnit(l, c, unit, res.parsed_output)
        questions = mapped.questions
        dropped.length = 0
        dropped.push(...mapped.dropped)
        const bad = mapped.badQuotes
        if (bad.length * 2 <= res.parsed_output.sorular.length || attempt === 1) break
        const text0 = res.content.find((b) => b.type === 'text')
        messages.push({
          role: 'assistant',
          content: text0 && text0.type === 'text' ? text0.text : '{}'
        })
        messages.push({
          role: 'user',
          content: `Şu alıntılar parçada birebir geçmiyor:\n${bad.map((s) => '- ' + s).join('\n')}\nAlıntıları metinden kelimesi kelimesine kopyala ve tüm soruları yeniden ver.`
        })
      }
      const out: UnitOutput = {
        unitId: unit.unitId,
        hash: unit.hash,
        pages: unit.pages,
        questions,
        dropped
      }
      const file = path.join(unitsDir(l), unit.unitId + '.json')
      writeAtomic(file, JSON.stringify(out, null, 1))
      state.status = 'done'
      state.file = path.relative(l.buildDir, file)
      state.questionIds = questions.map((q) => q.id)
      delete state.error
      consumeFlags(l, unit.unitId)
      previous.push(...questions.map((q) => q.stem.md))
      console.log(
        `${unit.unitId}: ${questions.length} soru, ${dropped.length} düşen, $${state.usd.toFixed(3)} (toplam $${cp.totals.usd.toFixed(2)})`
      )
    } catch (e) {
      state.status = 'failed'
      state.error = e instanceof Error ? e.message : String(e)
      console.error(`${unit.unitId}: HATA ${state.error}`)
    }
    cp.units[unit.hash] = state
    saveCheckpoint(l, cp)
  }
  return cp
}
