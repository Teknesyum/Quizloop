import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import { iterateQuestions, readMeta } from '@core/modules/loader'
import type { CorePorts } from '@core/ports'
import type { BankQuestion, BankRow, CardStatus } from '@shared/ipc'
import type { Source } from '@shared/schema/question'
import type { Library } from './library'

export interface BankDeps {
  db: Kysely<Database>
  ports: CorePorts
  library: Library
  assetBase(moduleId: string): string
}

export interface FlagFile {
  modul: string
  surum: string
  bayraklar: {
    soru: string
    not: string | null
    ts: string
    kaynak?: { file: Source['file']; pages: Source['pages'] }
  }[]
}

function statusOf(c: { state: number; retired_at: string | null } | undefined): CardStatus {
  if (!c) return 'yeni'
  if (c.retired_at) return 'emekli'
  if (c.state === 0) return 'yeni'
  if (c.state === 2) return 'tekrar'
  return 'ogreniyor'
}

function plain(md: string): string {
  const s = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[*_`#>$]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return s.length > 220 ? s.slice(0, 219).trimEnd() + '…' : s
}

async function flagsOf(
  db: Kysely<Database>,
  moduleId: string
): Promise<Map<string, { note: string | null; ts: string }>> {
  const rows = await db
    .selectFrom('flag')
    .select(['question_id', 'note', 'ts'])
    .where('module_id', '=', moduleId)
    .orderBy('ts')
    .execute()
  const out = new Map<string, { note: string | null; ts: string }>()
  for (const r of rows)
    out.set(r.question_id, { note: r.note ?? out.get(r.question_id)?.note ?? null, ts: r.ts })
  return out
}

export async function moduleQuestions(deps: BankDeps, moduleId: string): Promise<BankRow[]> {
  const { db, ports } = deps
  await deps.library.refresh()
  const root = deps.library.rootOf(moduleId)
  if (!root) return []
  const cards = await db
    .selectFrom('card')
    .select(['question_id', 'state', 'retired_at', 'due', 'chapter'])
    .where('module_id', '=', moduleId)
    .execute()
  const byQ = new Map(cards.map((c) => [c.question_id, c]))
  const flags = await flagsOf(db, moduleId)
  const out: BankRow[] = []
  for await (const q of iterateQuestions(ports, await readMeta(ports, root), false)) {
    if (q.deleted) continue
    const c = byQ.get(q.id)
    const f = flags.get(q.id)
    out.push({
      questionId: q.id,
      chapter: c?.chapter ?? q.source.chapter ?? null,
      kind: q.kind,
      difficulty: q.difficulty,
      stem: plain(q.stem.md),
      status: statusOf(c),
      due: c && c.state !== 0 && !c.retired_at ? c.due : null,
      flagged: Boolean(f),
      note: f?.note ?? null
    })
  }
  return out
}

export async function moduleQuestion(
  deps: BankDeps,
  moduleId: string,
  questionId: string
): Promise<BankQuestion | null> {
  await deps.library.refresh()
  const q = await (await deps.library.indexFor(moduleId)).get(questionId)
  if (!q) return null
  return {
    questionId: q.id,
    stem: q.stem,
    kind: q.kind,
    choices: q.choices,
    correct: q.correct,
    beklenenCevap: q.beklenenCevap,
    solution: q.solution,
    source: q.source,
    assetBase: deps.assetBase(moduleId)
  }
}

export async function setFlag(
  deps: BankDeps,
  moduleId: string,
  questionId: string,
  flagged: boolean,
  note?: string
): Promise<void> {
  const { db } = deps
  if (flagged) {
    await db
      .insertInto('flag')
      .values({
        module_id: moduleId,
        question_id: questionId,
        ts: deps.ports.now().toISOString(),
        note: note ?? null
      })
      .execute()
  } else {
    await db
      .deleteFrom('flag')
      .where('module_id', '=', moduleId)
      .where('question_id', '=', questionId)
      .execute()
  }
}

export async function flagFile(deps: BankDeps, moduleId: string): Promise<FlagFile | null> {
  const { ports } = deps
  await deps.library.refresh()
  const root = deps.library.rootOf(moduleId)
  if (!root) return null
  const meta = (await readMeta(ports, root)).meta
  const flags = await flagsOf(deps.db, moduleId)
  const idx = await deps.library.indexFor(moduleId)
  const bayraklar: FlagFile['bayraklar'] = []
  for (const [soru, f] of flags) {
    const q = await idx.get(soru)
    bayraklar.push({
      soru,
      not: f.note,
      ts: f.ts,
      ...(q ? { kaynak: { file: q.source.file, pages: q.source.pages } } : {})
    })
  }
  return { modul: meta.id, surum: meta.version, bayraklar }
}
