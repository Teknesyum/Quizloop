import { unzip, type Unzipped } from 'fflate'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
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

export async function unpack(file: string, base = tmpdir()): Promise<Unpacked> {
  const dir = resolve(mkdtempSync(join(base, 'quizloop-paket-')))
  const cleanup = (): void => rmSync(dir, { recursive: true, force: true })
  try {
    const files = await inflate(readFileSync(file))
    for (const [name, data] of Object.entries(files)) {
      if (name.endsWith('/')) continue
      const out = resolve(dir, name)
      if (!out.startsWith(dir + sep)) throw new Error(`paket dışına yazan yol: ${name}`)
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, data)
    }
    const root = findRoot(dir)
    if (!root) throw new Error('pakette module.json yok')
    return { root, cleanup }
  } catch (e) {
    cleanup()
    throw e
  }
}
