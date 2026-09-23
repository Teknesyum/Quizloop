import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { Loaded } from './rules.ts'
import type { Plan, Unit } from './plan.ts'
import type { Checkpoint } from './checkpoint.ts'
import { saveCheckpoint } from './checkpoint.ts'
import { Generated, loadOutputs } from './generate.ts'
import { sha256 } from './hash.ts'

export const FlagFile = z.object({
  modul: z.string(),
  surum: z.string().optional(),
  disaAktarim: z.string().optional(),
  bayraklar: z.array(
    z.object({
      soru: z.string(),
      not: z.string().nullable().optional(),
      ts: z.string().optional(),
      kaynak: z.object({ file: z.string(), pages: z.tuple([z.number(), z.number()]) }).optional()
    })
  )
})

export type FlagFile = z.infer<typeof FlagFile>

export interface IdEntry {
  unit: Unit
  gorsel: boolean
  kok: string
}

export interface FlagItem {
  soru: string
  kok: string
  not: string | null
  ts?: string
}

export interface FlagGroup {
  key: string
  outId: string
  unit: Unit
  gorsel: boolean
  items: FlagItem[]
}

export interface FlagPlan {
  total: number
  groups: FlagGroup[]
  unmapped: string[]
  otherLane: string[]
}

export interface FlagNoteFile {
  unitId: string
  hash: string
  gorsel: boolean
  bayraklar: FlagItem[]
}

export function flagsDir(l: Loaded): string {
  return path.join(l.buildDir, 'bayraklar')
}

export function questionId(l: Loaded, unit: Unit, kok: string): string {
  return `${l.rules.module.id}-${sha256(unit.hash + '\n' + kok.trim()).slice(0, 12)}`
}

export function short(s: string, n = 90): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}

export function questionIndex(l: Loaded, plan: Plan, cp?: Checkpoint): Map<string, IdEntry> {
  const byHash = new Map(plan.units.map((u) => [u.hash, u]))
  const byId = new Map(plan.units.map((u) => [u.unitId, u]))
  const index = new Map<string, IdEntry>()
  for (const out of loadOutputs(l)) {
    const gorsel = out.unitId.endsWith('-gorsel')
    const unit = byHash.get(out.hash) ?? byId.get(out.unitId.replace(/-gorsel$/, ''))
    if (!unit) continue
    for (const q of out.questions)
      if (!index.has(q.id)) index.set(q.id, { unit, gorsel, kok: q.stem.md })
  }
  for (const gorsel of [false, true]) {
    const dir = path.join(l.buildDir, gorsel ? 'rawgorsel' : 'raw')
    if (!fs.existsSync(dir)) continue
    for (const unit of plan.units) {
      const file = path.join(dir, unit.unitId + '.json')
      if (!fs.existsSync(file)) continue
      let data: unknown
      try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'))
      } catch {
        continue
      }
      const g = Generated.safeParse(data)
      if (!g.success) continue
      for (const s of g.data.sorular) {
        const id = questionId(l, unit, s.kok)
        if (!index.has(id)) index.set(id, { unit, gorsel, kok: s.kok.trim() })
      }
    }
  }
  if (cp)
    for (const [key, st] of Object.entries(cp.units)) {
      const [hash, lane] = key.split(':')
      const unit = byHash.get(hash!)
      if (!unit) continue
      for (const id of st.questionIds)
        if (!index.has(id)) index.set(id, { unit, gorsel: lane === 'gorsel', kok: '' })
    }
  return index
}

export function planFlags(
  l: Loaded,
  plan: Plan,
  cp: Checkpoint,
  file: FlagFile,
  gorsel: boolean
): FlagPlan {
  if (file.modul !== l.rules.module.id)
    throw new Error(`bayrak dosyası başka modülün: ${file.modul} ≠ ${l.rules.module.id}`)
  const index = questionIndex(l, plan, cp)
  const groups = new Map<string, FlagGroup>()
  const unmapped: string[] = []
  const otherLane: string[] = []
  for (const f of file.bayraklar) {
    const e = index.get(f.soru)
    if (!e) {
      unmapped.push(f.soru)
      continue
    }
    if (e.gorsel !== gorsel) {
      otherLane.push(f.soru)
      continue
    }
    const key = gorsel ? e.unit.hash + ':gorsel' : e.unit.hash
    const g = groups.get(key) ?? {
      key,
      outId: gorsel ? e.unit.unitId + '-gorsel' : e.unit.unitId,
      unit: e.unit,
      gorsel,
      items: []
    }
    if (!g.items.some((x) => x.soru === f.soru))
      g.items.push({ soru: f.soru, kok: short(e.kok), not: f.not?.trim() || null, ts: f.ts })
    groups.set(key, g)
  }
  return {
    total: file.bayraklar.length,
    groups: [...groups.values()].sort((a, b) => a.outId.localeCompare(b.outId)),
    unmapped,
    otherLane
  }
}

export function applyFlags(l: Loaded, cp: Checkpoint, fp: FlagPlan): void {
  const dir = flagsDir(l)
  fs.mkdirSync(dir, { recursive: true })
  for (const g of fp.groups) {
    const target = path.join(dir, g.outId + '.json')
    const prev: FlagNoteFile | null = fs.existsSync(target)
      ? (JSON.parse(fs.readFileSync(target, 'utf8')) as FlagNoteFile)
      : null
    const items = [...(prev?.bayraklar ?? [])]
    for (const it of g.items) {
      const i = items.findIndex((x) => x.soru === it.soru)
      if (i >= 0) items[i] = it
      else items.push(it)
    }
    const note: FlagNoteFile = {
      unitId: g.unit.unitId,
      hash: g.unit.hash,
      gorsel: g.gorsel,
      bayraklar: items
    }
    fs.writeFileSync(target + '.tmp', JSON.stringify(note, null, 1))
    fs.renameSync(target + '.tmp', target)
    const raw = path.join(l.buildDir, g.gorsel ? 'rawgorsel' : 'raw', g.unit.unitId + '.json')
    if (fs.existsSync(raw)) {
      const old = path.join(dir, 'eski-raw')
      fs.mkdirSync(old, { recursive: true })
      fs.renameSync(raw, path.join(old, g.outId + '.json'))
    }
    const st = cp.units[g.key] ?? {
      unitId: g.outId,
      hash: g.unit.hash,
      status: 'failed' as const,
      attempts: 0,
      questionIds: [],
      inputTokens: 0,
      outputTokens: 0,
      usd: 0
    }
    st.status = 'failed'
    st.error = `bayrak: ${items.length} soru`
    cp.units[g.key] = st
  }
  saveCheckpoint(l, cp)
}

export function flagNote(l: Loaded, outId: string): string {
  const file = path.join(flagsDir(l), outId + '.json')
  if (!fs.existsSync(file)) return ''
  const note = JSON.parse(fs.readFileSync(file, 'utf8')) as FlagNoteFile
  if (!note.bayraklar.length) return ''
  const lines = note.bayraklar.map((b) => `- ${b.kok || b.soru} — ${b.not ?? 'not düşülmemiş'}`)
  return `\n\nÖnceki üretimde bu sorular bozuk bulundu; aynı hatayı tekrarlama:\n${lines.join('\n')}`
}

export function consumeFlags(l: Loaded, outId: string): void {
  const file = path.join(flagsDir(l), outId + '.json')
  if (!fs.existsSync(file)) return
  const done = path.join(flagsDir(l), 'islendi')
  fs.mkdirSync(done, { recursive: true })
  fs.renameSync(file, path.join(done, outId + '.json'))
}

export function formatFlagPlan(fp: FlagPlan, gorsel: boolean, dryRun: boolean): string {
  const n = fp.groups.reduce((a, g) => a + g.items.length, 0)
  const out = [
    `${fp.total} bayrak, ${n} eşlendi → ${fp.groups.length} birim (${gorsel ? 'görsel' : 'metin'} turu)`
  ]
  for (const g of fp.groups) out.push(`  ${g.outId}: ${g.items.map((i) => i.soru).join(', ')}`)
  out.push(
    `eşlenemeyen: ${fp.unmapped.length}${fp.unmapped.length ? ' — ' + fp.unmapped.join(', ') : ''}`
  )
  if (fp.otherLane.length)
    out.push(
      `öbür turda (${gorsel ? '--gorsel olmadan' : '--gorsel ile'} çalıştır): ${fp.otherLane.join(', ')}`
    )
  out.push(
    dryRun
      ? 'dry-run: hiçbir şey yazılmadı'
      : `kuyruğa alındı: checkpoint güncellendi, notlar build/bayraklar/`
  )
  return out.join('\n')
}
