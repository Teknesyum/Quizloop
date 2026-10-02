import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import {
  CompiledQuery,
  type DatabaseConnection,
  type DatabaseIntrospector,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type Kysely,
  type QueryCompiler,
  type QueryResult,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler
} from 'kysely'

export interface Handle {
  current(): Promise<SQLiteDBConnection>
  reopen(): Promise<SQLiteDBConnection>
  generation(): number
}

const READS = /^\s*(select|pragma|with|explain|values)\b/i
const BEGIN = /^\s*begin\b/i
const COMMIT = /^\s*(commit|end)\b/i
const ROLLBACK = /^\s*rollback\s*(transaction)?\s*;?\s*$/i
const LOST = /not opened|not open|closed|no connection|does not exist/i

function bindable(v: unknown): unknown {
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'bigint') return Number(v)
  if (v === undefined) return null
  return v
}

class Mutex {
  private tail: Promise<void> = Promise.resolve()
  private release: (() => void) | null = null

  async lock(): Promise<void> {
    const prev = this.tail
    let open!: () => void
    this.tail = new Promise<void>((r) => (open = r))
    await prev
    this.release = open
  }

  unlock(): void {
    const r = this.release
    this.release = null
    r?.()
  }
}

export class CapacitorConnection implements DatabaseConnection {
  inTransaction = false

  constructor(private readonly handle: Handle) {}

  async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    try {
      return await this.run<R>(compiled)
    } catch (e) {
      if (this.inTransaction || !LOST.test(String(e))) throw e
      await this.handle.reopen()
      return this.run<R>(compiled)
    }
  }

  private async run<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    const db = await this.handle.current()
    const sql = compiled.sql
    const values = compiled.parameters.map(bindable)
    if (BEGIN.test(sql)) {
      await db.beginTransaction()
      this.inTransaction = true
      return { rows: [] }
    }
    if (COMMIT.test(sql)) {
      this.inTransaction = false
      await db.commitTransaction()
      return { rows: [] }
    }
    if (ROLLBACK.test(sql)) {
      this.inTransaction = false
      await db.rollbackTransaction()
      return { rows: [] }
    }
    if (READS.test(sql)) {
      const r = await db.query(sql, values)
      return { rows: (r.values ?? []) as R[] }
    }
    const r = await db.run(sql, values, false)
    const changes = r.changes?.changes
    const lastId = r.changes?.lastId
    return {
      rows: [],
      numAffectedRows: changes != null && changes >= 0 ? BigInt(changes) : undefined,
      insertId: lastId != null && lastId >= 0 ? BigInt(lastId) : undefined
    }
  }

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('streaming is not supported')
  }
}

export class CapacitorDriver implements Driver {
  private readonly mutex = new Mutex()
  private readonly connection: CapacitorConnection

  constructor(private readonly handle: Handle) {
    this.connection = new CapacitorConnection(handle)
  }

  async init(): Promise<void> {
    await this.handle.current()
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.mutex.lock()
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
    this.mutex.unlock()
  }

  async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.mutex.lock()
    try {
      return await fn()
    } finally {
      this.mutex.unlock()
    }
  }

  async destroy(): Promise<void> {
    const db = await this.handle.current()
    await db.close()
  }
}

export class CapacitorDialect implements Dialect {
  constructor(readonly driver: CapacitorDriver) {}

  createDriver(): Driver {
    return this.driver
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }

  createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
    return new SqliteIntrospector(db)
  }
}
