import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ModuleMeta } from '@shared/schema/module'
import { Block, type Question } from '@shared/schema/question'

export interface LoadedModule {
  meta: ModuleMeta
  root: string
}

export class ModuleError extends Error {
  constructor(
    message: string,
    public readonly issues: string[] = []
  ) {
    super(message)
  }
}

function issueLines(err: { issues: { path: PropertyKey[]; message: string }[] }): string[] {
  return err.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
}

export function normalize(input: Buffer | string): string {
  const text = typeof input === 'string' ? input : input.toString('utf8')
  return text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n')
}

export function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(normalize(buf), 'utf8').digest('hex')
}

export function readMeta(root: string): LoadedModule {
  const file = join(root, 'module.json')
  if (!existsSync(file)) throw new ModuleError('module.json missing')
  const parsed = ModuleMeta.safeParse(JSON.parse(readFileSync(file, 'utf8')))
  if (!parsed.success) throw new ModuleError('module.json invalid', issueLines(parsed.error))
  return { meta: parsed.data, root: resolve(root) }
}

export function readBlock(root: string, file: string, expectedSha?: string): Block {
  const full = join(root, file)
  if (!existsSync(full)) throw new ModuleError(`block missing: ${file}`)
  const buf = readFileSync(full)
  if (expectedSha && sha256(buf) !== expectedSha)
    throw new ModuleError(`block hash mismatch: ${file}`)
  const parsed = Block.safeParse(JSON.parse(buf.toString('utf8')))
  if (!parsed.success) throw new ModuleError(`block invalid: ${file}`, issueLines(parsed.error))
  return parsed.data
}

export function* iterateQuestions(mod: LoadedModule, verify = true): Generator<Question> {
  for (const ref of mod.meta.blocks) {
    const block = readBlock(mod.root, ref.file, verify ? ref.sha256 : undefined)
    for (const q of block.questions) yield q
  }
}

export function validateModule(root: string): { meta: ModuleMeta; count: number } {
  const mod = readMeta(root)
  let count = 0
  const ids = new Set<string>()
  for (const q of iterateQuestions(mod)) {
    if (ids.has(q.id)) throw new ModuleError(`duplicate question id: ${q.id}`)
    ids.add(q.id)
    count++
  }
  if (count !== mod.meta.questionCount) {
    throw new ModuleError(`questionCount ${mod.meta.questionCount} but found ${count}`)
  }
  return { meta: mod.meta, count }
}

export class QuestionIndex {
  private byId = new Map<string, Question>()
  private loaded = new Set<string>()
  private locator = new Map<string, string>()

  constructor(private readonly mod: LoadedModule) {}

  private ensureLocator(): void {
    if (this.locator.size) return
    for (const ref of this.mod.meta.blocks) {
      const block = readBlock(this.mod.root, ref.file)
      for (const q of block.questions) this.locator.set(q.id, ref.file)
      this.loaded.add(ref.file)
      for (const q of block.questions) this.byId.set(q.id, q)
    }
  }

  get(id: string): Question | undefined {
    const hit = this.byId.get(id)
    if (hit) return hit
    this.ensureLocator()
    return this.byId.get(id)
  }

  get root(): string {
    return this.mod.root
  }
}
