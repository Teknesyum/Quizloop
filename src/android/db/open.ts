import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite'
import { Kysely } from 'kysely'
import { Migrator } from 'kysely/migration'
import { provider } from '@core/db/migrations'
import type { Database } from '@core/db/types'
import type { IntegrityReport } from '@shared/ipc'
import { CapacitorDialect, CapacitorDriver, type Handle } from './dialect'

const NAME = 'quizloop'

export interface AndroidDatabase {
  db: Kysely<Database>
  integrity: IntegrityReport
  journal: string
  firstRun: boolean
  migrated: string[]
  generation(): number
  resume(): Promise<boolean>
}

async function pragma<T>(c: SQLiteDBConnection, statement: string): Promise<T[]> {
  return ((await c.query(statement)).values ?? []) as T[]
}

async function prepare(c: SQLiteDBConnection): Promise<string> {
  await pragma(c, 'PRAGMA foreign_keys = ON')
  const wal = await pragma<{ journal_mode: string }>(c, 'PRAGMA journal_mode = WAL')
  let mode = String(wal[0]?.journal_mode ?? '').toLocaleLowerCase('tr')
  if (mode !== 'wal') {
    const del = await pragma<{ journal_mode: string }>(c, 'PRAGMA journal_mode = DELETE')
    mode = String(del[0]?.journal_mode ?? 'delete').toLocaleLowerCase('tr')
  }
  await pragma(c, 'PRAGMA synchronous = NORMAL')
  return mode
}

export async function openDatabase(): Promise<AndroidDatabase> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  let conn: SQLiteDBConnection | null = null
  let opening: Promise<SQLiteDBConnection> | null = null
  let gen = 0
  let journal = ''

  const connect = async (fresh: boolean): Promise<SQLiteDBConnection> => {
    if (fresh) {
      conn = null
      await sqlite.closeConnection(NAME, false).catch(() => undefined)
    }
    const consistent = (await sqlite.checkConnectionsConsistency()).result ?? false
    const known = (await sqlite.isConnection(NAME, false)).result ?? false
    const c =
      consistent && known
        ? await sqlite.retrieveConnection(NAME, false)
        : await sqlite.createConnection(NAME, false, 'no-encryption', 1, false)
    if (!(await c.isDBOpen()).result) await c.open()
    journal = await prepare(c)
    gen++
    conn = c
    return c
  }

  const once = (fresh: boolean): Promise<SQLiteDBConnection> => {
    opening ??= connect(fresh).finally(() => {
      opening = null
    })
    return opening
  }

  const handle: Handle = {
    current: async () => conn ?? (await once(false)),
    reopen: () => once(true),
    generation: () => gen
  }

  const driver = new CapacitorDriver(handle)
  const db = new Kysely<Database>({ dialect: new CapacitorDialect(driver) })

  const first = await handle.current()
  const rows = await pragma<{ quick_check: string }>(first, 'PRAGMA quick_check')
  const detail = rows.map((r) => r.quick_check).join('\n') || 'ok'
  const integrity = { ok: detail === 'ok', detail }

  const migrator = new Migrator({ db, provider })
  const applied = (await migrator.getMigrations()).filter((m) => m.executedAt).length
  const { error, results } = await migrator.migrateToLatest()
  if (error) throw error

  const alive = async (): Promise<boolean> => {
    const c = conn
    if (!c) return false
    try {
      if (!(await c.isDBOpen()).result) return false
      await c.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  const resume = (): Promise<boolean> =>
    driver.exclusive(async () => {
      if (await alive()) return false
      await once(true)
      return true
    })

  return {
    db,
    integrity,
    journal,
    firstRun: applied === 0,
    migrated: (results ?? []).filter((r) => r.status === 'Success').map((r) => r.migrationName),
    generation: () => gen,
    resume
  }
}
