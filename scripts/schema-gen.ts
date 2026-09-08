import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { ModuleMeta } from '../src/shared/schema/module'
import { Block, Question } from '../src/shared/schema/question'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'schema')
mkdirSync(out, { recursive: true })

const targets: [string, z.ZodType][] = [
  ['module.schema.json', ModuleMeta],
  ['question.schema.json', Question],
  ['block.schema.json', Block]
]

for (const [name, schema] of targets) {
  const json = z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12' })
  const doc = { $id: `https://quizloop.dev/schema/${name}`, ...json }
  writeFileSync(join(out, name), JSON.stringify(doc, null, 2) + '\n', 'utf8')
  process.stdout.write(`${name}\n`)
}
