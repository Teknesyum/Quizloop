import { zipSync, strToU8 } from 'fflate'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isPackage, unpack } from './paket'

function write(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ql-test-'))
  const file = join(dir, 'm.qlmod')
  const entries = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]))
  writeFileSync(file, zipSync(entries))
  return file
}

describe('paket', () => {
  it('recognises package extensions', () => {
    expect(isPackage('a/b.qlmod')).toBe(true)
    expect(isPackage('a/b.ZIP')).toBe(true)
    expect(isPackage('a/b')).toBe(false)
  })

  it('unpacks a module at the archive root', async () => {
    const p = await unpack(write({ 'module.json': '{}', 'blocks/0001.json': '[]' }))
    expect(readFileSync(join(p.root, 'blocks', '0001.json'), 'utf8')).toBe('[]')
    p.cleanup()
    expect(existsSync(p.root)).toBe(false)
  })

  it('finds a module inside a single folder', async () => {
    const p = await unpack(write({ 'm/module.json': '{}' }))
    expect(p.root.endsWith('m')).toBe(true)
    p.cleanup()
  })

  it('rejects paths that escape the folder', async () => {
    await expect(unpack(write({ '../kac.txt': 'x', 'module.json': '{}' }))).rejects.toThrow()
  })

  it('rejects an archive without module.json', async () => {
    await expect(unpack(write({ 'a.txt': 'x' }))).rejects.toThrow('module.json')
  })
})
