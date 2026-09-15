import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, isAbsolute, join, resolve } from 'node:path'
import { SCHEME } from './protocol'

type Remembered = Record<string, string>

let cache: Remembered | null = null

function file(): string {
  return join(app.getPath('userData'), 'kaynak.json')
}

function remembered(): Remembered {
  if (cache) return cache
  try {
    cache = JSON.parse(readFileSync(file(), 'utf8')) as Remembered
  } catch {
    cache = {}
  }
  return cache
}

export function rememberPdf(moduleId: string, path: string): void {
  const next = { ...remembered(), [moduleId]: resolve(path) }
  const target = file()
  mkdirSync(join(target, '..'), { recursive: true })
  const tmp = target + '.tmp'
  writeFileSync(tmp, JSON.stringify(next, null, 2))
  renameSync(tmp, target)
  cache = next
}

export function forgetPdf(moduleId: string): void {
  const next = { ...remembered() }
  delete next[moduleId]
  const target = file()
  mkdirSync(join(target, '..'), { recursive: true })
  const tmp = target + '.tmp'
  writeFileSync(tmp, JSON.stringify(next, null, 2))
  renameSync(tmp, target)
  cache = next
}

export function resolvePdf(moduleId: string, root: string, sourceFile?: string): string | null {
  const known = remembered()[moduleId]
  if (known && existsSync(known) && /\.pdf$/i.test(known)) return known
  const named = sourceFile ? basename(sourceFile) : null
  const name = named && /\.pdf$/i.test(named) ? named : null
  const guesses: string[] = []
  if (name) {
    guesses.push(join(root, 'kaynak', name), join(root, name))
    if (sourceFile && isAbsolute(sourceFile)) guesses.push(sourceFile)
  }
  for (const g of guesses) if (existsSync(g)) return resolve(g)
  return null
}

export function kaynakBase(moduleId: string): string {
  return `${SCHEME}://kaynak/${moduleId}/kitap.pdf`
}
