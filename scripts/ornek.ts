import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ModuleMeta } from '../src/shared/schema/module'
import { Question } from '../src/shared/schema/question'

interface Section {
  page: number
  chapter: string
  text: string
}

interface Draft {
  chapter: string
  page: number
  difficulty: 'kolay' | 'orta' | 'zor'
  concept: string
  stem: string
  choices: string[]
  why: string[]
  solution: string
  hint?: string
  tell?: string
  quote: string
  tags: string[]
}

interface Spec {
  draft: string
  id: string
  name: string
  version: string
  description: string
  tags: string[]
  title: string
}

const SPECS: Spec[] = [
  {
    draft: 'rehber',
    id: 'quizloop-rehberi',
    name: 'QuizLoop Rehberi: Uygulama Nasıl Kullanılır',
    version: '1.0.3',
    description:
      'Modül nedir, nasıl eklenir, oturum nasıl işler, sorular neden geri gelir: uygulamayı soru çözerek öğreten rehber.',
    tags: ['rehber', 'örnek'],
    title: 'QuizLoop Rehber Notları'
  },
  {
    draft: 'genel-kultur',
    id: 'genel-kultur',
    name: 'Genel Kültür: Kolaydan Zora',
    version: '1.0.1',
    description:
      'Bilgi yarışması tadında, kolay, orta ve zor üç bölümlük özgün genel kültür soruları.',
    tags: ['genel-kültür', 'örnek'],
    title: 'QuizLoop Genel Kültür Notları'
  }
]

const KEYS = ['A', 'B', 'C', 'D', 'E'] as const
const NOTES = 'notlar.md'
const CREATED = '2026-10-04T00:00:00.000Z'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function sha256(text: string): string {
  return createHash('sha256').update(text.replace(/\r\n/g, '\n'), 'utf8').digest('hex')
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]])
        )
      : v
  )
}

function build(spec: Spec): number {
  const file = join(root, 'scripts', 'ornek', `${spec.draft}.json`)
  const { sections, questions } = JSON.parse(readFileSync(file, 'utf8')) as {
    sections: Section[]
    questions: Draft[]
  }
  const pages = new Map(sections.map((s) => [s.page, s]))
  const chapters = [...new Set(sections.map((s) => s.chapter))]
  const seen = new Set<string>()
  const errors: string[] = []
  const blocks = chapters.map(() => [] as unknown[])

  questions.forEach((d, i) => {
    const id = `${spec.id}-${String(i + 1).padStart(4, '0')}`
    const fail = (m: string): number => errors.push(`${id} (${d.concept}): ${m}`)
    const section = pages.get(d.page)
    if (!section) fail(`page ${d.page} has no section`)
    else if (!section.text.includes(d.quote)) fail('quote is not in the section text')
    else if (section.chapter !== d.chapter) fail('chapter differs from the section chapter')
    if (seen.has(d.concept)) fail('concept repeats')
    seen.add(d.concept)
    if (d.why.length !== d.choices.length - 1) fail('why count does not match the wrong choices')
    if (new Set(d.choices).size !== d.choices.length) fail('choices repeat')

    const at = parseInt(sha256(id).slice(0, 8), 16) % d.choices.length
    const wrong = d.choices.slice(1).map((md, w) => ({ md, why: d.why[w] }))
    const order = [...wrong.slice(0, at), { md: d.choices[0], why: undefined }, ...wrong.slice(at)]
    const choices = order.map((c, k) => ({ key: KEYS[k], md: c.md }))
    const distractors = Object.fromEntries(
      order.flatMap((c, k) => (c.why ? [[KEYS[k], c.why]] : []))
    )
    const solution = [
      { type: 'text', md: d.solution },
      ...(d.hint ? [{ type: 'hint', md: d.hint }] : [])
    ]
    const stem = { md: d.stem }
    const correct = KEYS[at]
    const parsed = Question.safeParse({
      id,
      conceptId: d.concept,
      stem,
      choices,
      correct,
      distractors,
      solution,
      ...(d.tell ? { anlatim: [{ type: 'text', md: d.tell }] } : {}),
      source: { file: NOTES, pages: [d.page, d.page], quote: d.quote, chapter: d.chapter },
      difficulty: d.difficulty,
      tags: d.tags,
      contentHash: sha256(canonical({ stem, choices, correct, solution }))
    })
    if (!parsed.success) fail(parsed.error.issues.map((x) => x.message).join('; '))
    else blocks[chapters.indexOf(d.chapter)]?.push(parsed.data)
  })

  if (errors.length) throw new Error(`${spec.draft}:\n${errors.join('\n')}`)

  const out = join(root, 'resources', 'ornek', spec.id)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(join(out, 'blocks'), { recursive: true })
  const refs = blocks.map((list, b) => {
    const blockId = String(b + 1).padStart(4, '0')
    const text = JSON.stringify({ blockId, questions: list }, null, 2) + '\n'
    writeFileSync(join(out, 'blocks', `${blockId}.json`), text)
    return { file: `blocks/${blockId}.json`, count: list.length, sha256: sha256(text) }
  })
  const notes = [
    `# ${spec.title}`,
    ...sections.map((s) => `## Sayfa ${s.page}: ${s.chapter}\n\n${s.text}`)
  ]
  writeFileSync(join(out, NOTES), notes.join('\n\n') + '\n')
  const meta = ModuleMeta.parse({
    schemaVersion: 1,
    id: spec.id,
    name: spec.name,
    version: spec.version,
    language: 'tr',
    description: spec.description,
    tags: spec.tags,
    source: { title: spec.title, file: NOTES, pages: sections.length },
    blocks: refs,
    questionCount: questions.length,
    createdAt: CREATED
  })
  writeFileSync(join(out, 'module.json'), JSON.stringify(meta, null, 2) + '\n')
  return questions.length
}

for (const spec of SPECS) console.log(`${spec.id} ${build(spec)}`)
