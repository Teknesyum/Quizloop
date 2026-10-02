import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { QuestionIndex, readMeta } from '@core/modules/loader'
import type { CorePorts } from '@core/ports'

export class Library {
  private roots = new Map<string, string>()
  private indexes = new Map<string, QuestionIndex>()

  constructor(
    private readonly db: Kysely<Database>,
    private readonly ports: CorePorts
  ) {}

  async refresh(): Promise<void> {
    const rows = await this.db.selectFrom('module').select(['id', 'path']).execute()
    this.roots.clear()
    for (const r of rows) this.roots.set(r.id, r.path)
    for (const id of [...this.indexes.keys()]) if (!this.roots.has(id)) this.indexes.delete(id)
  }

  rootOf(moduleId: string): string | undefined {
    return this.roots.get(moduleId)
  }

  async indexFor(moduleId: string): Promise<QuestionIndex> {
    const hit = this.indexes.get(moduleId)
    if (hit) return hit
    const root = this.roots.get(moduleId)
    if (!root) throw new Error(`module not loaded: ${moduleId}`)
    const idx = new QuestionIndex(this.ports, await readMeta(this.ports, root))
    this.indexes.set(moduleId, idx)
    return idx
  }

  async reload(): Promise<void> {
    this.indexes.clear()
    await this.refresh()
  }
}
