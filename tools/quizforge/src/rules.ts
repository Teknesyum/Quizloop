import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { z } from 'zod'
import { sha256 } from './hash.ts'

const Range = z.tuple([z.number().int().positive(), z.number().int().positive()])

export const Rules = z.object({
  module: z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
    ad: z.string().min(1),
    surum: z.string().regex(/^\d+\.\d+\.\d+$/),
    dil: z.string().default('tr')
  }),
  kaynak: z.object({
    tip: z.enum(['pdf', 'web']),
    yol: z.string(),
    sha256: z.string().length(64).optional(),
    kulliyat: z.string(),
    bolumHaritasi: z.string(),
    sayfaNumarasi: z.enum(['pdf', 'kitap']).default('pdf'),
    sayfaOfseti: z.number().int().default(0),
    govde: Range,
    atlanacakSayfalar: z.array(Range).default([]),
    atlanacakBolumler: z.array(z.number().int()).default([])
  }),
  uretim: z.object({
    parcaBirimi: z.enum(['altBaslik', 'sabit']).default('altBaslik'),
    parcaSayfaAraligi: Range.default([3, 8]),
    parcaBasinaSoru: z.number().int().positive().default(8),
    sikSayisi: z.number().int().min(2).max(5).default(5),
    zorlukDagilimi: z
      .object({ kolay: z.number(), orta: z.number(), zor: z.number() })
      .default({ kolay: 0.3, orta: 0.5, zor: 0.2 }),
    cozumBloklari: z
      .array(z.enum(['text', 'hint', 'formula', 'table', 'image']))
      .default(['text', 'hint']),
    yasakli: z.array(z.string()).default([]),
    aliciOnce: z.boolean().default(true)
  }),
  stil: z
    .object({ ton: z.string().default(''), uzunluk: z.string().default('') })
    .default({ ton: '', uzunluk: '' })
})

export type Rules = z.infer<typeof Rules>

export interface Loaded {
  rules: Rules
  rulesHash: string
  root: string
  dir: string
  buildDir: string
}

export function loadRules(file: string): Loaded {
  const abs = path.resolve(file)
  const raw = fs.readFileSync(abs, 'utf8')
  const rules = Rules.parse(parse(raw))
  const dir = path.dirname(abs)
  const root = findRoot(dir)
  const buildDir = path.join(dir, 'build')
  return { rules, rulesHash: sha256(raw), root, dir, buildDir }
}

function findRoot(from: string): string {
  let d = from
  while (
    !fs.existsSync(path.join(d, 'package.json')) ||
    !fs.existsSync(path.join(d, 'src', 'shared'))
  ) {
    const up = path.dirname(d)
    if (up === d) throw new Error('repo root not found above ' + from)
    d = up
  }
  return d
}
