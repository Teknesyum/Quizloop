import {
  CompiledQuery,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type DatabaseConnection,
  type Dialect,
  type Driver,
  type QueryResult
} from 'kysely'
import { Migrator } from 'kysely/migration'
import { provider } from '@core/db/migrations'
import type { Database } from '@core/db/types'
import type { IntegrityReport } from '@shared/ipc'
import type { DbReady, DbReply, DbRequest } from './worker'

export interface WebDatabase {
  db: Kysely<Database>
  integrity: IntegrityReport
  firstRun: boolean
  migrated: string[]
}

type Run = (sql: string, bind: readonly unknown[]) => Promise<DbReply>

function bindable(v: unknown): unknown {
  if (typeof v === 'boolean') return v ? 1 : 0
  if (v === undefined) return null
  return v
}

function connect(): Promise<Run> {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const waiting = new Map<number, (r: DbReply) => void>()
  let seq = 0
  const run: Run = (sql, bind) =>
    new Promise((ok, no) => {
      const id = ++seq
      waiting.set(id, (r) => (r.error ? no(new Error(r.error)) : ok(r)))
      const request: DbRequest = { id, sql, bind: bind.map(bindable) }
      worker.postMessage(request)
    })
  return new Promise((ok, no) => {
    worker.addEventListener('error', (e) => no(new Error(e.message || 'database worker failed')))
    worker.addEventListener('message', (e: MessageEvent<DbReply | DbReady>) => {
      const m = e.data
      if ('ready' in m) {
        if (m.ready) ok(run)
        else no(new Error(m.error ?? 'database failed to open'))
        return
      }
      const done = waiting.get(m.id)
      waiting.delete(m.id)
      done?.(m)
    })
  })
}

class WorkerConnection implements DatabaseConnection {
  constructor(private readonly run: Run) {}

  async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    const r = await this.run(compiled.sql, compiled.parameters)
    return {
      rows: (r.rows ?? []) as R[],
      numAffectedRows: r.changes != null ? BigInt(r.changes) : undefined,
      insertId: r.lastId != null ? BigInt(r.lastId) : undefined
    }
  }

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('streaming is not supported')
  }
}

class WorkerDriver implements Driver {
  private tail: Promise<void> = Promise.resolve()
  private release: (() => void) | null = null
  private readonly connection: WorkerConnection

  constructor(run: Run) {
    this.connection = new WorkerConnection(run)
  }

  async init(): Promise<void> {
    return undefined
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const prev = this.tail
    let open!: () => void
    this.tail = new Promise<void>((r) => (open = r))
    await prev
    this.release = open
    return this.connection
  }

  async beginTransaction(c: DatabaseConnection): Promise<void> {
    await c.executeQuery(CompiledQuery.raw('begin'))
  }

  async commitTransaction(c: DatabaseConnection): Promise<void> {
    await c.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(c: DatabaseConnection): Promise<void> {
    await c.executeQuery(CompiledQuery.raw('rollback'))
  }

  async releaseConnection(): Promise<void> {
    const r = this.release
    this.release = null
    r?.()
  }

  async destroy(): Promise<void> {
    return undefined
  }
}

export async function openDatabase(): Promise<WebDatabase> {
  const run = await connect()
  const driver = new WorkerDriver(run)
  const dialect: Dialect = {
    createDriver: () => driver,
    createQueryCompiler: () => new SqliteQueryCompiler(),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: (db) => new SqliteIntrospector(db)
  }
  const db = new Kysely<Database>({ dialect })

  const check = await run('PRAGMA quick_check', [])
  const detail = (check.rows ?? []).map((r) => String(r.quick_check)).join('\n') || 'ok'

  const migrator = new Migrator({ db, provider })
  const applied = (await migrator.getMigrations()).filter((m) => m.executedAt).length
  const { error, results } = await migrator.migrateToLatest()
  if (error) throw error

  return {
    db,
    integrity: { ok: detail === 'ok', detail },
    firstRun: applied === 0,
    migrated: (results ?? []).filter((r) => r.status === 'Success').map((r) => r.migrationName)
  }
}
