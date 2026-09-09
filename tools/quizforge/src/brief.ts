import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'
import { unitText, type Corpus } from './corpus.ts'
import type { Plan, Unit } from './plan.ts'
import { systemPrompt, userPrompt, unitsDir } from './generate.ts'
import { loadOutputs } from './generate.ts'

export function briefDir(l: Loaded): string {
  return path.join(l.buildDir, 'briefs')
}

export function rawDir(l: Loaded): string {
  return path.join(l.buildDir, 'raw')
}

const CONTRACT = `## Çıktı

Yalnız şu şekilde tek bir JSON dosyası yaz, başka hiçbir şey yazma:

{"sorular":[{"alinti":"...","sayfa":{"baslangic":0,"bitis":0},"kavram":"...","kok":"...",
"siklar":[{"anahtar":"A","metin":"..."}],"dogru":"A",
"celdiriciler":[{"anahtar":"B","aciklama":"..."}],
"cozum":[{"tur":"text","metin":"..."}],"zorluk":"orta","etiketler":["..."]}]}

Dosyanın yolu bu dosyanın kendi klasöründeki değil, aşağıda yazan RAW yoludur.
Kaynak metni değiştirme, yeni bilgi ekleme, internete çıkma.`

export function writeBriefs(l: Loaded, c: Corpus, plan: Plan, units: Unit[]): string[] {
  const dir = briefDir(l)
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(rawDir(l), { recursive: true })
  const previous = loadOutputs(l).flatMap((u) => u.questions.map((q) => q.stem.md))
  const files: string[] = []
  for (const unit of units) {
    const raw = path.join(rawDir(l), unit.unitId + '.json')
    const body = [
      systemPrompt(l),
      '',
      CONTRACT,
      '',
      `RAW: ${raw}`,
      '',
      userPrompt(unit, unitText(l, c, ...unit.pages), previous.slice(-120))
    ].join('\n')
    const file = path.join(dir, unit.unitId + '.md')
    fs.writeFileSync(file, body)
    files.push(file)
  }
  fs.writeFileSync(
    path.join(dir, 'index.json'),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        units: units.map((u) => ({
          unitId: u.unitId,
          hash: u.hash,
          chapter: u.chapter,
          pages: u.pages,
          brief: path.join(dir, u.unitId + '.md'),
          raw: path.join(rawDir(l), u.unitId + '.json')
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
