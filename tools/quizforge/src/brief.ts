import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'
import { unitText, type Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import { systemPrompt, userPrompt, unitsDir } from './generate.ts'
import { loadOutputs } from './generate.ts'
import { flagNote } from './flags.ts'

export function briefDir(l: Loaded): string {
  return path.join(l.buildDir, 'briefs')
}

export function rawDir(l: Loaded, gorsel = false): string {
  return path.join(l.buildDir, gorsel ? 'rawgorsel' : 'raw')
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
"gorsel":"<dosya adı>" alanını doldur.

Dosyanın yolu bu dosyanın kendi klasöründeki değil, aşağıda yazan RAW yoludur.
Kaynak metni değiştirme, yeni bilgi ekleme, internete çıkma.`

export function writeBriefs(
  l: Loaded,
  c: Corpus,
  plan: Plan,
  units: Unit[],
  gorsel = false
): string[] {
  const dir = gorsel ? path.join(l.buildDir, 'gorsel') : briefDir(l)
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(rawDir(l, gorsel), { recursive: true })
  const previous = loadOutputs(l).flatMap((u) => u.questions.map((q) => q.stem.md))
  const figures = gorsel ? figureIndex(l) : []
  const files: string[] = []
  for (const unit of units) {
    const raw = path.join(rawDir(l, gorsel), unit.unitId + '.json')
    const mine = figures.filter((f) => f.pdfSayfa >= unit.pages[0] && f.pdfSayfa <= unit.pages[1])
    if (gorsel && !mine.length) continue
    const list = mine
      .map((f) => {
        const cap = f.altyazilar?.[0]
        return `- ${f.dosya} (sayfa ${f.pdfSayfa}${cap ? `, ${cap.tur} ${cap.no}` : ''})`
      })
      .join('\n')
    const body = [
      systemPrompt(l, gorsel),
      '',
      CONTRACT,
      '',
      `RAW: ${raw}`,
      '',
      userPrompt(unit, unitText(l, c, ...unit.pages), previous.slice(-120)) +
        flagNote(l, gorsel ? unit.unitId + '-gorsel' : unit.unitId),
      gorsel ? `\n<gorseller>\n${list}\n</gorseller>` : ''
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
        units: listed.map((u) => ({
          unitId: u.unitId,
          hash: u.hash,
          chapter: u.chapter,
          pages: u.pages,
          brief: path.join(dir, u.unitId + '.md'),
          raw: path.join(rawDir(l, gorsel), u.unitId + '.json')
        }))
      },
      null,
      1
    )
  )
  void plan
  void unitsDir
  return files
}
