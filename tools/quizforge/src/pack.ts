import fs from 'node:fs'
import path from 'node:path'
import { ModuleMeta } from '../../../src/shared/schema/module.ts'
import { Block, type Question as QuestionT } from '../../../src/shared/schema/question.ts'
import type { Loaded } from './rules.ts'
import type { Corpus } from './corpus.ts'
import { loadOutputs } from './generate.ts'
import { sha256 } from './hash.ts'
import type { Report } from './verify.ts'

const BLOCK_SIZE = 50

export function pack(l: Loaded, c: Corpus): string {
  const reportFile = path.join(l.buildDir, 'verify-report.json')
  if (!fs.existsSync(reportFile)) throw new Error('önce `quizforge verify`')
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8')) as Report
  if (!report.ok) throw new Error(`verify geçmedi: ${report.errors.length} hata`)
  const questions: QuestionT[] = loadOutputs(l)
    .flatMap((u) => u.questions)
    .sort((a, b) => a.source.pages[0] - b.source.pages[0] || a.id.localeCompare(b.id))
  const outDir = path.join(l.root, 'modules', l.rules.module.id)
  const blocksDir = path.join(outDir, 'blocks')
  fs.rmSync(blocksDir, { recursive: true, force: true })
  fs.mkdirSync(blocksDir, { recursive: true })
  const blocks: { file: string; count: number; sha256: string }[] = []
  for (let i = 0; i < questions.length; i += BLOCK_SIZE) {
    const blockId = String(blocks.length + 1).padStart(4, '0')
    const block = Block.parse({ blockId, questions: questions.slice(i, i + BLOCK_SIZE) })
    const data = JSON.stringify(block, null, 1)
    const file = `blocks/${blockId}.json`
    fs.writeFileSync(path.join(outDir, file), data)
    blocks.push({ file, count: block.questions.length, sha256: sha256(data) })
  }
  const meta = ModuleMeta.parse({
    schemaVersion: 1,
    id: l.rules.module.id,
    name: l.rules.module.ad,
    version: l.rules.module.surum,
    language: l.rules.module.dil,
    source: { title: l.rules.module.ad, file: c.file, pages: c.pages.size },
    blocks,
    questionCount: questions.length,
    createdAt: new Date().toISOString()
  })
  fs.writeFileSync(path.join(outDir, 'module.json'), JSON.stringify(meta, null, 1))
  return outDir
}
