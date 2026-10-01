import { unzip, type Unzipped } from 'fflate'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { pool } from '@main/fstree'
import { dirname, join, resolve, sep } from 'node:path'

export const PACKAGE_EXT = 'qlmod'

export interface Unpacked {
  root: string
  cleanup(): void
}

export function isPackage(p: string): boolean {
  return /\.(qlmod|zip)$/i.test(p)
}

function inflate(buf: Uint8Array): Promise<Unzipped> {
  return new Promise((ok, no) => unzip(buf, (e, d) => (e ? no(e) : ok(d))))
}

function findRoot(dir: string): string | null {
  if (existsSync(join(dir, 'module.json'))) return dir
  const subs = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())
  if (subs.length === 1 && existsSync(join(dir, subs[0]!.name, 'module.json')))
    return join(dir, subs[0]!.name)
  return null
}

export interface UnpackTicks {
  read?(): void
  write?(done: number, total: number): void
}

export async function unpack(
  file: string,
  base = tmpdir(),
  ticks: UnpackTicks = {}
): Promise<Unpacked> {
  const dir = resolve(mkdtempSync(join(base, 'quizloop-paket-')))
  const cleanup = (): void => rmSync(dir, { recursive: true, force: true })
  try {
    const buf = await readFile(file)
    ticks.read?.()
    const entries = Object.entries(await inflate(buf)).filter(([name]) => !name.endsWith('/'))
    for (const [name] of entries) {
      if (!resolve(dir, name).startsWith(dir + sep))
        throw new Error(`paket dışına yazan yol: ${name}`)
    }
    for (const d of new Set(entries.map(([name]) => dirname(resolve(dir, name)))))
      await mkdir(d, { recursive: true })
    await pool(
      entries,
      (d, t) => ticks.write?.(d, t),
      ([name, data]) => writeFile(resolve(dir, name), data)
    )
    const root = findRoot(dir)
    if (!root) throw new Error('pakette module.json yok')
    return { root, cleanup }
  } catch (e) {
    cleanup()
    throw e
  }
}
