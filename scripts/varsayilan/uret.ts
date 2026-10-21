import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ModuleMeta } from '../../src/shared/schema/module'
import { Question } from '../../src/shared/schema/question'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(root, 'resources', 'varsayilan')
const BLOCK_SIZE = 200
const CC_BY_SA = 'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)'

interface Raw {
  id: string
  tags: string[]
  deleted?: boolean
  source: { file: string }
  [key: string]: unknown
}

function sha256(text: string): string {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  return createHash('sha256').update(body.split('\r\n').join('\n'), 'utf8').digest('hex')
}

function readModule(id: string): { meta: ModuleMeta; blocks: { file: string; text: string }[] } {
  const dir = join(root, 'modules', id)
  if (!existsSync(join(dir, 'module.json'))) throw new Error(`modules/${id}/module.json yok`)
  const meta = ModuleMeta.parse(JSON.parse(readFileSync(join(dir, 'module.json'), 'utf8')))
  const blocks = meta.blocks.map((ref) => {
    const text = readFileSync(join(dir, ref.file), 'utf8')
    if (sha256(text) !== ref.sha256) throw new Error(`${id}/${ref.file}: sha256 tutmuyor`)
    return { file: ref.file, text }
  })
  return { meta, blocks }
}

function writeModule(meta: ModuleMeta, blocks: { file: string; text: string }[]): void {
  const dir = join(OUT, meta.id)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, 'blocks'), { recursive: true })
  for (const b of blocks) writeFileSync(join(dir, b.file), b.text)
  writeFileSync(join(dir, 'module.json'), JSON.stringify(ModuleMeta.parse(meta), null, 2) + '\n')
}

const ARAPCA_SURUM: Record<string, string> = { '0.1.4': '0.1.5' }

function arapca(): string {
  const { meta, blocks } = readModule('arapca')
  const version = ARAPCA_SURUM[meta.version]
  if (!version) throw new Error(`arapca ${meta.version}: ARAPCA_SURUM bu sürümü tanımıyor`)
  writeModule(
    {
      ...meta,
      version,
      description:
        `${meta.description ?? ''} Lisans: CC BY-SA 4.0. Kaynak: Wiktionary ve Vikisözlük katkıcıları (Kaikki.org), FrequencyWords (Hermit Dave).`.trim(),
      source: {
        ...meta.source,
        sayfaOfseti: meta.source?.sayfaOfseti ?? 0,
        title: [
          `Lisans: ${CC_BY_SA}`,
          'Wiktionary katkıcıları, Arapça girişler (https://en.wiktionary.org), CC BY-SA 4.0',
          'Vikisözlük katkıcıları, Türkçe karşılıklar (https://tr.wiktionary.org), CC BY-SA 4.0',
          'Kaikki.org Wiktionary dökümü, 2026-10-03 (https://kaikki.org)',
          'FrequencyWords 2018 ar_50k, Hermit Dave, OpenSubtitles derleminden (https://github.com/hermitdave/FrequencyWords), kod MIT, içerik CC BY-SA 4.0',
          'Kural dosyaları ve Wiktionary örneği olmayan kartların cümleleri QuizLoop üretimidir'
        ].join('; ')
      }
    },
    blocks
  )
  return `arapca ${version}: ${meta.questionCount} soru, ${blocks.length} blok`
}

function openRules(): Set<string> {
  const dir = join(root, 'sources', 'ingilizce', 'dilbilgisi')
  if (!existsSync(dir)) throw new Error('sources/ingilizce/dilbilgisi yok')
  const open = new Set<string>()
  for (const name of readdirSync(dir).sort()) {
    if (!/^[abc][12]-.+\.md$/.test(name)) continue
    const text = readFileSync(join(dir, name), 'utf8')
    const kimlik = /^kimlik:\s*(\S+)/m.exec(text)?.[1]
    const cefrj = /^cefrj:\s*(.+)$/m.exec(text)?.[1]?.trim()
    if (!kimlik || cefrj === undefined) throw new Error(`${name}: kimlik ya da cefrj satırı yok`)
    if (cefrj === '[]') open.add(kimlik)
  }
  return open
}

const CEFRJ_FILE = 'CEFR-J Vocabulary Profile 1.5, satır '
const OCTANOVE_FILE = 'Octanove Vocabulary Profile C1/C2 1.0, satır '

function ingilizceLite(): string {
  const { meta, blocks } = readModule('ingilizce')
  const open = openRules()
  const kept: Raw[] = []
  const say = { kelime: 0, dilbilgisi: 0, kural: new Set<string>(), elenen: 0 }
  for (const b of blocks) {
    for (const q of (JSON.parse(b.text) as { questions: Raw[] }).questions) {
      const m = /^ingilizce-(a1|a2|b1|b2|c1|c2)-(k|g)-/.exec(q.id)
      if (!m) throw new Error(`${q.id}: tanınmayan kimlik`)
      let keep: boolean
      if (m[2] === 'k') keep = m[1] === 'c1' || m[1] === 'c2'
      else {
        const kural = q.tags.find((t) => t.startsWith('kural:'))?.slice(6)
        if (!kural) throw new Error(`${q.id}: kural etiketi yok`)
        keep = open.has(kural)
        if (keep) say.kural.add(kural)
      }
      if (!keep || q.deleted) {
        say.elenen += 1
        continue
      }
      const file = q.source.file.startsWith(CEFRJ_FILE)
        ? OCTANOVE_FILE + q.source.file.slice(CEFRJ_FILE.length)
        : q.source.file
      const out = { ...q, source: { ...q.source, file } }
      if (JSON.stringify(out).includes('CEFR-J')) throw new Error(`${q.id}: CEFR-J izi kaldı`)
      const parsed = Question.safeParse(out)
      if (!parsed.success) throw new Error(`${q.id}: ${parsed.error.issues[0]?.message ?? ''}`)
      if (m[2] === 'k') say.kelime += 1
      else say.dilbilgisi += 1
      kept.push(out)
    }
  }
  const outBlocks: { file: string; text: string }[] = []
  for (let i = 0; i < kept.length; i += BLOCK_SIZE) {
    const blockId = String(outBlocks.length + 1).padStart(4, '0')
    const text = JSON.stringify({ blockId, questions: kept.slice(i, i + BLOCK_SIZE) })
    outBlocks.push({ file: `blocks/${blockId}.json`, text })
  }
  writeModule(
    {
      schemaVersion: 1,
      id: 'ingilizce-lite',
      name: 'İngilizce Lite',
      version: '0.1.0',
      language: 'tr',
      description: `Açık lisanslı kaynaklardan ${say.kelime} C1-C2 kelime kartı ve ${say.kural.size} kuraldan ${say.dilbilgisi} dil bilgisi sorusu. Kelime düzeyleri Octanove Vocabulary Profile'dan gelir. Lisans: CC BY-SA 4.0.`,
      tags: ['ingilizce'],
      source: {
        title: [
          `Lisans: ${CC_BY_SA}`,
          'Octanove Vocabulary Profile C1/C2 1.0, Octanove Labs (https://github.com/openlanguageprofiles/olp-en-cefrj), CC BY-SA 4.0',
          'Open English WordNet 2025 (https://en-word.net), CC BY 4.0',
          'Wiktionary katkıcıları, Türkçe girişler, Kaikki.org dökümü (https://kaikki.org), CC BY-SA 4.0',
          'ipa-dict en_US, Open Dict Data (https://github.com/open-dict-data/ipa-dict), MIT',
          'Kural dosyaları ve Türkçe karşılıkların bir kısmı QuizLoop üretimidir'
        ].join('; '),
        sayfaOfseti: 0
      },
      blocks: outBlocks.map((b) => ({
        file: b.file,
        count: (JSON.parse(b.text) as { questions: unknown[] }).questions.length,
        sha256: sha256(b.text)
      })),
      questionCount: kept.length,
      createdAt: meta.createdAt
    },
    outBlocks
  )
  return `ingilizce-lite 0.1.0: ${kept.length} soru (kelime ${say.kelime}, dil bilgisi ${say.dilbilgisi}, kural ${say.kural.size}), elenen ${say.elenen}, ${outBlocks.length} blok`
}

console.log(arapca())
console.log(ingilizceLite())
