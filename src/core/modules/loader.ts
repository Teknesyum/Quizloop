import { joinPath, type CorePorts } from '@core/ports'
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

export function normalize(text: string): string {
  return text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n')
}

export function hashText(ports: CorePorts, text: string): Promise<string> {
  return ports.sha256(normalize(text))
}

export async function readMeta(ports: CorePorts, root: string): Promise<LoadedModule> {
  const file = joinPath(root, 'module.json')
  if (!(await ports.exists(file))) throw new ModuleError('module.json missing')
  const parsed = ModuleMeta.safeParse(JSON.parse(await ports.readText(file)))
  if (!parsed.success) throw new ModuleError('module.json invalid', issueLines(parsed.error))
  return { meta: parsed.data, root }
}

export async function readBlock(
  ports: CorePorts,
  root: string,
  file: string,
  expectedSha?: string
): Promise<Block> {
  const full = joinPath(root, file)
  if (!(await ports.exists(full))) throw new ModuleError(`block missing: ${file}`)
  const text = await ports.readText(full)
  if (expectedSha && (await hashText(ports, text)) !== expectedSha)
    throw new ModuleError(`block hash mismatch: ${file}`)
  const parsed = Block.safeParse(JSON.parse(text))
  if (!parsed.success) throw new ModuleError(`block invalid: ${file}`, issueLines(parsed.error))
  return parsed.data
}

export async function* iterateQuestions(
  ports: CorePorts,
  mod: LoadedModule,
  verify = true
): AsyncGenerator<Question> {
  for (const ref of mod.meta.blocks) {
    const block = await readBlock(ports, mod.root, ref.file, verify ? ref.sha256 : undefined)
    for (const q of block.questions) yield q
  }
}

export async function validateModule(
  ports: CorePorts,
  root: string
): Promise<{ meta: ModuleMeta; count: number }> {
  const mod = await readMeta(ports, root)
  let count = 0
  const ids = new Set<string>()
  for await (const q of iterateQuestions(ports, mod)) {
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
  private loading: Promise<void> | null = null

  constructor(
    private readonly ports: CorePorts,
    private readonly mod: LoadedModule
  ) {}

  private async load(): Promise<void> {
    for (const ref of this.mod.meta.blocks) {
      const block = await readBlock(this.ports, this.mod.root, ref.file)
      for (const q of block.questions) this.byId.set(q.id, q)
    }
  }

  async get(id: string): Promise<Question | undefined> {
    const hit = this.byId.get(id)
    if (hit) return hit
    this.loading ??= this.load().catch((e: unknown) => {
      this.loading = null
      throw e
    })
    await this.loading
    return this.byId.get(id)
  }

  get root(): string {
    return this.mod.root
  }
}
