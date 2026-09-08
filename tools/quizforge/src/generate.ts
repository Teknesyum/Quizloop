import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import {
  Question,
  type Question as QuestionT,
  type SolutionBlock
} from '../../../src/shared/schema/question.ts'
import { quoteInText } from '../../../src/shared/text.ts'
import type { Loaded } from './rules.ts'
import { rangeText, unitText, type Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import {
  cleanPartials,
  loadCheckpoint,
  saveCheckpoint,
  writeAtomic,
  type Checkpoint
} from './checkpoint.ts'
import { canonical, sha256 } from './hash.ts'

const Key = z.enum(['A', 'B', 'C', 'D', 'E'])

const Generated = z.object({
  sorular: z.array(
    z.object({
      alinti: z.string(),
      sayfa: z.object({ baslangic: z.number().int(), bitis: z.number().int() }),
      kavram: z.string(),
      kok: z.string(),
      siklar: z.array(z.object({ anahtar: Key, metin: z.string() })),
      dogru: Key,
      celdiriciler: z.array(z.object({ anahtar: Key, aciklama: z.string() })),
      cozum: z.array(z.object({ tur: z.enum(['text', 'hint']), metin: z.string() })),
      zorluk: z.enum(['kolay', 'orta', 'zor']),
      etiketler: z.array(z.string())
    })
  )
})

type Generated = z.infer<typeof Generated>

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

export function systemPrompt(l: Loaded): string {
  const u = l.rules.uretim
  const s = l.rules.stil
  const keys = ['A', 'B', 'C', 'D', 'E'].slice(0, u.sikSayisi).join(', ')
  return [
    `Sen tıp eğitimi için çoktan seçmeli sınav sorusu yazan bir editörsün. Kaynak: "${l.rules.module.ad}".`,
    `Sana bir kitap parçası verilecek; sayfalar "[[sayfa N]]" işaretiyle ayrılmış. Yalnız bu parçadaki bilgiden soru üret.`,
    `Sıra kesin: önce parçadan birebir bir alıntı seç (alinti, 15-60 kelime, metinde geçtiği gibi, düzeltme yapma), sonra o alıntıdan soruyu yaz. Alıntısı metinde bulunmayan soru çöpe gider.`,
    `sayfa.baslangic ve sayfa.bitis alıntının geçtiği [[sayfa N]] numaralarıdır.`,
    `Parça başına ${u.parcaBasinaSoru} soru. Her soruda ${u.sikSayisi} şık (${keys}); tek doğru. Doğru şıkkın harfi sorular arasında dengeli dağılsın.`,
    `celdiriciler: her yanlış şık için ayrı bir açıklama — neden yanlış olduğu, tek cümle. Doğru şık için açıklama yazma.`,
    `cozum: sıralı bloklar; türler ${u.cozumBloklari.join(', ')}. İlk blok text türünde, doğru cevabı kaynağa dayanarak açıklar.`,
    `Zorluk dağılımı yaklaşık kolay %${Math.round(u.zorlukDagilimi.kolay * 100)}, orta %${Math.round(u.zorlukDagilimi.orta * 100)}, zor %${Math.round(u.zorlukDagilimi.zor * 100)}.`,
    `kavram: sorunun sınadığı tek kavram, 2-5 kelime. etiketler: 1-4 kısa konu etiketi.`,
    u.yasakli.length
      ? `Yasak: ${u.yasakli.join(', ')}. Şekil, tablo veya görsele atıf yapan soru yazma.`
      : '',
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

function slug(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function toQuestion(l: Loaded, c: Corpus, unit: Unit, g: Generated['sorular'][number]): QuestionT {
  const stem = { md: g.kok.trim() }
  const choices = g.siklar.map((s) => ({ key: s.anahtar, md: s.metin.trim() }))
  const solution: SolutionBlock[] = g.cozum.map((b) => ({ type: b.tur, md: b.metin.trim() }))
  const chapter = c.chapters.find((x) => x.chapter === unit.chapter)
  const a = Math.min(g.sayfa.baslangic, g.sayfa.bitis)
  const b = Math.max(g.sayfa.baslangic, g.sayfa.bitis)
  const pages: [number, number] = [Math.max(a, unit.pages[0]), Math.min(b, unit.pages[1])]
  return {
    id: `${l.rules.module.id}-${sha256(unit.hash + '\n' + stem.md).slice(0, 12)}`,
    conceptId: slug(g.kavram) || 'genel',
    stem,
    choices,
    correct: g.dogru,
    distractors: Object.fromEntries(
      g.celdiriciler.filter((d) => d.anahtar !== g.dogru).map((d) => [d.anahtar, d.aciklama.trim()])
    ) as QuestionT['distractors'],
    solution,
    source: {
      file: c.file,
      pages,
      quote: g.alinti.trim(),
      chapter: chapter ? `${chapter.chapter} ${chapter.title}` : String(unit.chapter)
    },
    difficulty: g.zorluk,
    tags: g.etiketler.map((t) => t.trim()).filter(Boolean),
    contentHash: sha256(canonical({ stem, choices, correct: g.dogru, solution })),
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
          userPrompt(first, unitText(c, ...first.pages), []).slice(0, 3000) +
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
    const text = unitText(c, ...unit.pages)
    const haystack = rangeText(c, unit.pages[0] - 1, unit.pages[1] + 1)
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userPrompt(unit, text, previous.slice(-200)) }
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
        questions = []
        dropped.length = 0
        const bad: string[] = []
        for (const g of res.parsed_output.sorular) {
          if (!quoteInText(g.alinti, haystack)) {
            bad.push(g.alinti)
            dropped.push({ kok: g.kok, reason: 'alıntı metinde yok' })
            continue
          }
          const q = toQuestion(l, c, unit, g)
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
