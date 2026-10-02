import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { Directory, Filesystem } from '@capacitor/filesystem'

const DIR = 'backups'
const PREFIX = 'quizloop.db.bak-'
const KEEP = 2

async function prune(): Promise<void> {
  const { files } = await Filesystem.readdir({ directory: Directory.Data, path: DIR })
  const old = files
    .filter((f) => f.name.startsWith(PREFIX))
    .sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0))
    .slice(KEEP)
  for (const f of old)
    await Filesystem.deleteFile({ directory: Directory.Data, path: `${DIR}/${f.name}` })
}

export async function backupBeforeMigration(
  conn: SQLiteDBConnection,
  version: string
): Promise<string | null> {
  const name = `${PREFIX}${version.replace(/[^0-9A-Za-z.-]/g, '_')}`
  const path = `${DIR}/${name}`
  await Filesystem.mkdir({ directory: Directory.Data, path: DIR, recursive: true }).catch(
    () => undefined
  )
  await Filesystem.deleteFile({ directory: Directory.Data, path }).catch(() => undefined)
  const { uri } = await Filesystem.getUri({ directory: Directory.Data, path })
  const file = uri.replace(/^file:\/\//, '').replaceAll("'", "''")
  await conn.query(`VACUUM INTO '${file}'`)
  await prune()
  return name
}
