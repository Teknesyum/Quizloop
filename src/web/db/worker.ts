import init, { type SAHPoolUtil } from '@sqlite.org/sqlite-wasm'

export interface DbRequest {
  id: number
  sql: string
  bind: unknown[]
}

export interface DbReply {
  id: number
  rows?: Record<string, unknown>[]
  changes?: number
  lastId?: number
  error?: string
}

export interface DbReady {
  ready: boolean
  error?: string
}

const FILE = '/quizloop.db'
const RETRIES = 6
const RETRY_MS = 400

type Db = InstanceType<SAHPoolUtil['OpfsSAHPoolDb']>

const reply = (m: DbReply | DbReady): void => (postMessage as (m: unknown) => void)(m)
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function open(): Promise<{ db: Db; lastId(): number }> {
  const sqlite3 = await init()
  let pool: SAHPoolUtil | null = null
  let failure: unknown = null
  for (let i = 0; i < RETRIES && !pool; i++) {
    try {
      pool = await sqlite3.installOpfsSAHPoolVfs({ name: 'quizloop', initialCapacity: 6 })
    } catch (e) {
      failure = e
      await sleep(RETRY_MS)
    }
  }
  if (!pool) throw failure
  const db = new pool.OpfsSAHPoolDb(FILE)
  db.exec('PRAGMA foreign_keys = ON')
  return { db, lastId: () => Number(sqlite3.capi.sqlite3_last_insert_rowid(db)) }
}

const opened = open()

opened.then(
  () => reply({ ready: true }),
  (e: unknown) => reply({ ready: false, error: String(e) })
)

addEventListener('message', (e: MessageEvent<DbRequest>) => {
  const { id, sql, bind } = e.data
  void opened.then(
    ({ db, lastId }) => {
      try {
        const rows = db.exec({
          sql,
          bind: bind.length ? (bind as never) : undefined,
          rowMode: 'object',
          returnValue: 'resultRows'
        }) as Record<string, unknown>[]
        reply({ id, rows, changes: Number(db.changes()), lastId: lastId() })
      } catch (err) {
        reply({ id, error: String(err) })
      }
    },
    (err: unknown) => reply({ id, error: String(err) })
  )
})
