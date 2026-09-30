import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'
import { unitText, type Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import { systemPrompt, userPrompt, loadOutputs } from './generate.ts'
import { flagNote } from './flags.ts'
import { asTur, briefDirOf, rawDirOf, suffix, type Tur } from './tur.ts'
import { labelIndex, tableIndex } from './etiket.ts'

export function briefDir(l: Loaded, tur: Tur | boolean = 'metin'): string {
  return briefDirOf(l, asTur(tur))
}

export function rawDir(l: Loaded, tur: Tur | boolean = 'metin'): string {
  return rawDirOf(l, asTur(tur))
}

interface FigureRow {
  dosya: string
  pdfSayfa: number
  altyazilar?: { tur: string; no: string }[]
}

export function figureIndex(l: Loaded): FigureRow[] {
  const file = path.join(l.buildDir, 'figures', 'index.json')
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8')) as FigureRow[]
}

const CONTRACT = `## Çıktı

Yalnız şu şekilde tek bir JSON dosyası yaz, başka hiçbir şey yazma:

{"sorular":[{"alinti":"...","sayfa":{"baslangic":0,"bitis":0},"kavram":"...","kok":"...",
"siklar":[{"anahtar":"A","metin":"..."}],"dogru":"A",
"celdiriciler":[{"anahtar":"B","aciklama":"..."}],
"cozum":[{"tur":"text","metin":"..."}],"zorluk":"orta","etiketler":["..."],"vurgu":["..."]}]}

Açık uçlu soruda siklar, dogru ve celdiriciler alanlarını boş bırak; yerine
"tip":"acik-uclu" ve "beklenenCevap":"..." yaz. Görselden yazdığın soruda
"gorsel":"<dosya adı>" ve "gorselAlt":"<betimleme>" alanlarını doldur.
İsteğe bağlı: "cozumGorseli":"<dosya adı>", "cozumGorseliAlt":"...",
"cozumTablosu":{"baslik":"...","basliklar":["..."],"satirlar":[["..."]]}.

Dosyanın yolu bu dosyanın kendi klasöründeki değil, aşağıda yazan RAW yoludur.
Kaynak metni değiştirme, yeni bilgi ekleme, internete çıkma.`

const CONTRACT_TUR: Record<Tur, string> = {
  metin: '',
  gorsel: '',
  tablo: `Tablo sorusunda kökteki tablo:
"tablo":{"baslik":"Tablo 3-3 ...","basliklar":["...","..."],"satirlar":[["...","..."]],"satirBasligi":true}
Her satırda başlıklar kadar hücre olsun.`,
  etiket: `İşaretleme sorusu:
"tip":"isaretleme","gorsel":"<dosya adı>","gorselAlt":"...",
"isaretler":[{"anahtar":"A","etiket":"<etiket metni>"}],
"siklar":[],"dogru":"A","celdiriciler":[{"anahtar":"B","aciklama":"..."}]
Maskeli kök:
"gorsel":"<dosya adı>","gorselAlt":"...","maskeler":["<etiket metni>"], siklar metin olarak.
Kutu ya da koordinat yazma.`
}

function inUnit(unit: Unit, page: number): boolean {
  return page >= unit.pages[0] && page <= unit.pages[1]
}

function tableList(l: Loaded, unit: Unit): string {
  return tableIndex(l)
    .filter((t) => inUnit(unit, t.pdfSayfa))
    .map((t) =>
      [
        `### Tablo ${t.no} (sayfa ${t.pdfSayfa})${t.baslik ? ': ' + t.baslik : ''}`,
        `Görüntü (yalnız okumak için; "gorsel" alanına yazma): ${t.sayfaGorseli}`,
        `OCR:`,
        t.metin.trim()
      ].join('\n')
    )
    .join('\n\n')
}

function labelList(l: Loaded, unit: Unit): string {
  return labelIndex(l)
    .filter((f) => inUnit(unit, f.pdfSayfa) && f.etiketler.length)
    .map((f) =>
      [
        `### ${f.dosya} (sayfa ${f.pdfSayfa}${f.sekil ? ', Şekil ' + f.sekil : ''})`,
        `Görüntü: ${path.join(l.buildDir, 'figures', f.dosya)}`,
        f.altyazi ? `Altyazı: ${f.altyazi.trim()}` : '',
        `Etiketler: ${f.etiketler.map((e) => JSON.stringify(e.metin)).join(', ')}`
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n\n')
}

function figureList(l: Loaded, unit: Unit): string {
  return figureIndex(l)
    .filter((f) => inUnit(unit, f.pdfSayfa))
    .map((f) => {
      const cap = f.altyazilar?.[0]
      return `- ${f.dosya} (sayfa ${f.pdfSayfa}${cap ? `, ${cap.tur} ${cap.no}` : ''})`
    })
    .join('\n')
}

const EXTRA: Record<Exclude<Tur, 'metin'>, [string, (l: Loaded, u: Unit) => string]> = {
  gorsel: ['gorseller', figureList],
  tablo: ['tablolar', tableList],
  etiket: ['sekiller', labelList]
}

export function hasMaterial(l: Loaded, tur: Tur, unit: Unit): boolean {
  return tur === 'metin' || EXTRA[tur][1](l, unit) !== ''
}

export function writeBriefs(
  l: Loaded,
  c: Corpus,
  plan: Plan,
  units: Unit[],
  turArg: Tur | boolean = 'metin'
): string[] {
  const tur = asTur(turArg)
  const dir = briefDir(l, tur)
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(rawDir(l, tur), { recursive: true })
  const previous = loadOutputs(l).flatMap((u) => u.questions.map((q) => q.stem.md))
  const files: string[] = []
  for (const unit of units) {
    const raw = path.join(rawDir(l, tur), unit.unitId + '.json')
    let extra = ''
    if (tur !== 'metin') {
      const [tag, fn] = EXTRA[tur]
      const list = fn(l, unit)
      if (!list) continue
      extra = `\n<${tag}>\n${list}\n</${tag}>`
    }
    const body = [
      systemPrompt(l, tur),
      '',
      CONTRACT,
      CONTRACT_TUR[tur],
      '',
      `RAW: ${raw}`,
      '',
      userPrompt(unit, unitText(l, c, ...unit.pages), previous.slice(-120)) +
        flagNote(l, unit.unitId + suffix(tur)),
      extra
    ]
      .filter(Boolean)
      .join('\n')
    const file = path.join(dir, unit.unitId + '.md')
    fs.writeFileSync(file, body)
    files.push(file)
  }
  const written = new Set(files.map((f) => path.basename(f, '.md')))
  const listed = units.filter((u) => written.has(u.unitId))
  fs.writeFileSync(
    path.join(dir, 'index.json'),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        tur,
        units: listed.map((u) => ({
          unitId: u.unitId,
          hash: u.hash,
          chapter: u.chapter,
          pages: u.pages,
          brief: path.join(dir, u.unitId + '.md'),
          raw: path.join(rawDir(l, tur), u.unitId + '.json')
        }))
      },
      null,
      1
    )
  )
  void plan
  return files
}
