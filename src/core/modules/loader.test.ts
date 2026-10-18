import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { subtleSha256, type CorePorts } from '@core/ports'
import { atLeast, compareStandart, STANDART } from '@shared/standart'
import { validateModule } from './loader'

const SAMPLE = resolve('src/core/testdata/ornek')
const ROOT = '/mem/m'

type Json = Record<string, unknown>

function sample(): { meta: Json; blocks: Json[] } {
  const meta = JSON.parse(readFileSync(resolve(SAMPLE, 'module.json'), 'utf8')) as Json
  const refs = meta.blocks as { file: string }[]
  const blocks = refs.map((r) => JSON.parse(readFileSync(resolve(SAMPLE, r.file), 'utf8')) as Json)
  return { meta, blocks }
}

async function portsFor(meta: Json, blocks: Json[]): Promise<CorePorts> {
  const files = new Map<string, string>()
  const refs = meta.blocks as { file: string; sha256: string }[]
  for (const [i, ref] of refs.entries()) {
    const text = JSON.stringify(blocks[i])
    ref.sha256 = await subtleSha256(text)
    files.set(`${ROOT}/${ref.file}`, text)
  }
  files.set(`${ROOT}/module.json`, JSON.stringify(meta))
  return {
    readText: (p) => Promise.resolve(files.get(p) ?? ''),
    exists: (p) => Promise.resolve(files.has(p)),
    sha256: subtleSha256,
    now: () => new Date('2026-10-18T00:00:00.000Z')
  }
}

const BOLGE = { pdfSayfa: 12, bbox: [40, 80, 300, 260] }
const PARTS = [{ bolum: 1, ilkSayfa: 1, sonSayfa: 40, dosya: 'kaynak/bolum/01.pdf' }]

function firstQuestion(blocks: Json[]): Json {
  return (blocks[0]?.questions as Json[])[0] as Json
}

function withBookStem(
  standart: string | undefined,
  parts: boolean
): { meta: Json; blocks: Json[] } {
  const { meta, blocks } = sample()
  if (standart) meta.standart = standart
  else delete meta.standart
  meta.source = { title: 'Example Book', ...(parts ? { bolumler: PARTS } : {}) }
  const q = firstQuestion(blocks)
  const stem = q.stem as Json
  delete stem.imageRef
  stem.bolge = BOLGE
  return { meta, blocks }
}

describe('standart', () => {
  it('compares three-part versions', () => {
    expect(compareStandart('1.1.0', '1.0.9')).toBeGreaterThan(0)
    expect(compareStandart('1.10.0', '1.9.0')).toBeGreaterThan(0)
    expect(compareStandart('1.1.0', '1.1.0')).toBe(0)
    expect(atLeast(undefined, '1.1.0')).toBe(false)
    expect(atLeast('1.1.0', '1.1.0')).toBe(true)
  })
})

describe('validateModule standard rules', () => {
  it('keeps an old module with image files working', async () => {
    const { meta, blocks } = sample()
    const out = await validateModule(await portsFor(meta, blocks), ROOT)
    expect(out.count).toBe(meta.questionCount)
  })

  it('accepts a book-drawn image under the current standard', async () => {
    const { meta, blocks } = withBookStem(STANDART, true)
    const out = await validateModule(await portsFor(meta, blocks), ROOT)
    expect(out.count).toBe(meta.questionCount)
  })

  it('rejects a book-drawn image when the module does not declare the standard', async () => {
    const { meta, blocks } = withBookStem(undefined, true)
    await expect(validateModule(await portsFor(meta, blocks), ROOT)).rejects.toThrow(/standard/)
  })

  it('rejects a book-drawn image under 1.0.0', async () => {
    const { meta, blocks } = withBookStem('1.0.0', true)
    await expect(validateModule(await portsFor(meta, blocks), ROOT)).rejects.toThrow(/1\.1\.0/)
  })

  it('rejects a book-drawn image when the book is not in the package', async () => {
    const { meta, blocks } = withBookStem(STANDART, false)
    await expect(validateModule(await portsFor(meta, blocks), ROOT)).rejects.toThrow(/package/)
  })

  it('asks for an app update when the module is newer than the app', async () => {
    const { meta, blocks } = sample()
    meta.standart = '9.0.0'
    await expect(validateModule(await portsFor(meta, blocks), ROOT)).rejects.toThrow(
      /update the app/
    )
  })

  it('rejects a solution image with neither ref nor bolge', async () => {
    const { meta, blocks } = sample()
    const q = firstQuestion(blocks)
    ;(q.solution as Json[]).push({ type: 'image', caption: 'x' })
    await expect(validateModule(await portsFor(meta, blocks), ROOT)).rejects.toThrow(/ref or bolge/)
  })
})
