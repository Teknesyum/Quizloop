import SQLite from 'better-sqlite3'
import { copyFileSync, existsSync } from 'node:fs'
import { Kysely, SqliteDialect } from 'kysely'
import { Migrator } from 'kysely/migration'
import type { Database } from './types'
import { LATEST, provider } from './migrations'

export interface OpenResult {
  db: Kysely<Database>
  raw: SQLite.Database
  integrity: { ok: boolean; detail: string }
  migrated: string[]
}

export function checkIntegrity(raw: SQLite.Database): { ok: boolean; detail: string } {
  const rows = raw.pragma('integrity_check') as { integrity_check: string }[]
  const detail = rows.map((r) => r.integrity_check).join('\n')
  return { ok: detail === 'ok', detail }
}

function backupBeforeMigration(file: string, version: number): void {
  if (!existsSync(file)) return
  const target = `${file}.bak-v${version}`
  if (!existsSync(target)) copyFileSync(file, target)
}

export async function openDatabase(file: string): Promise<OpenResult> {
  const raw = new SQLite(file)
  raw.pragma('journal_mode = WAL')
  raw.pragma('foreign_keys = ON')
  raw.pragma('synchronous = NORMAL')

  const integrity = checkIntegrity(raw)

  const db = new Kysely<Database>({ dialect: new SqliteDialect({ database: raw }) })
  const migrator = new Migrator({ db, provider })

  const applied = (await migrator.getMigrations()).filter((m) => m.executedAt).length
  if (applied < LATEST && integrity.ok) backupBeforeMigration(file, applied)

  const { error, results } = await migrator.migrateToLatest()
  if (error) throw error

  return {
    db,
    raw,
    integrity,
    migrated: (results ?? []).filter((r) => r.status === 'Success').map((r) => r.migrationName)
  }
}

export function openMemory(): Promise<OpenResult> {
  return openDatabase(':memory:')
}
