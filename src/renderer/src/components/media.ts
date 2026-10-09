import type { Box, Choice, ChoiceKey, Mask, SolutionBlock, Table } from '@shared/schema/question'

export type MaskBox = Mask

export type MarkState = 'idle' | 'wrong' | 'right'

export interface MarkBox {
  key: ChoiceKey
  box: Box
  md: string
  state: MarkState
  open: boolean
  disabled: boolean
}

export function markBoxes(
  choices: Choice[],
  view: {
    wrong?: Partial<Record<ChoiceKey, unknown>>
    correct?: ChoiceKey
    open: boolean
    live: boolean
  }
): MarkBox[] {
  return choices.flatMap((c) => {
    if (!c.box) return []
    const wrong = Boolean(view.wrong?.[c.key])
    const right = view.open && view.correct === c.key
    return [
      {
        key: c.key,
        box: c.box,
        md: c.md,
        state: right ? 'right' : wrong ? 'wrong' : 'idle',
        open: view.open,
        disabled: !view.live || view.open || wrong
      }
    ]
  })
}

export const ALT_MAX = 120
export const ZOOM_MIN = 1
export const ZOOM_MAX = 6
export const ZOOM_STEP = 1.25

const unit = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

const pct = (n: number): string => `${+(n * 100).toFixed(3)}%`

export interface BoxPlace {
  left: string
  top: string
  width: string
  height: string
}

export function boxPlace(box: Box | readonly number[]): BoxPlace {
  const x = unit(box[0] ?? 0)
  const y = unit(box[1] ?? 0)
  const w = Math.min(unit(box[2] ?? 0), 1 - x)
  const h = Math.min(unit(box[3] ?? 0), 1 - y)
  return { left: pct(x), top: pct(y), width: pct(w), height: pct(h) }
}

export function boxVars(box: Box | readonly number[]): Record<string, string> {
  const p = boxPlace(box)
  return { '--ql-bx': p.left, '--ql-by': p.top, '--ql-bw': p.width, '--ql-bh': p.height }
}

export function tagSide(box: Box | readonly number[]): 'above' | 'below' {
  return unit(box[1] ?? 0) < 0.12 ? 'below' : 'above'
}

export function maskText(label?: string): string {
  return label && label.trim() ? label.trim() : '?'
}

export function plainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\$\$?([^$]*)\$\$?/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`#>~|\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function shortAlt(md: string, max = ALT_MAX): string {
  const s = plainText(md)
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return (space > max / 2 ? cut.slice(0, space) : cut).trimEnd() + '…'
}

export function altFor(
  explicit: string | undefined,
  md: string | undefined,
  fallback: string
): string {
  const own = explicit?.trim()
  if (own) return own
  const made = md ? shortAlt(md) : ''
  return made || fallback
}

export interface TableRow {
  head: string | null
  cells: string[]
}

export interface TableModel {
  header: string[]
  rows: TableRow[]
}

export function tableModel(table: Pick<Table, 'header' | 'rows' | 'rowHeader'>): TableModel {
  const width = Math.max(table.header.length, ...table.rows.map((r) => r.length))
  const pad = (r: string[]): string[] =>
    r.length >= width ? r : [...r, ...Array.from({ length: width - r.length }, () => '')]
  return {
    header: pad(table.header),
    rows: table.rows.map((r) => {
      const full = pad(r)
      return table.rowHeader
        ? { head: full[0] ?? '', cells: full.slice(1) }
        : { head: null, cells: full }
    })
  }
}

export const TABLE_SPLIT_ROWS = 8

export function tableParts<T>(rows: T[], width: number): T[][] {
  const most = width <= 2 ? 3 : width === 3 ? 2 : 1
  const count = Math.min(most, Math.ceil(rows.length / TABLE_SPLIT_ROWS))
  if (count <= 1) return [rows]
  const size = Math.ceil(rows.length / count)
  return Array.from({ length: count }, (_, i) => rows.slice(i * size, (i + 1) * size))
}

export function nextZoom(scale: number, dir: 1 | -1): number {
  const raw = dir > 0 ? scale * ZOOM_STEP : scale / ZOOM_STEP
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, raw))
  return Math.abs(clamped - 1) < 0.01 ? 1 : +clamped.toFixed(3)
}

export function clampPan(
  pan: { x: number; y: number },
  scale: number,
  size: { width: number; height: number }
): { x: number; y: number } {
  const mx = Math.max(0, (size.width * (scale - 1)) / 2)
  const my = Math.max(0, (size.height * (scale - 1)) / 2)
  return {
    x: Math.min(mx, Math.max(-mx, pan.x)) + 0,
    y: Math.min(my, Math.max(-my, pan.y)) + 0
  }
}

export function tellSteps(blocks: SolutionBlock[]): SolutionBlock[][] {
  const steps: SolutionBlock[][] = []
  let open: SolutionBlock[] = []
  for (const b of blocks) {
    open.push(b)
    if (b.type === 'sayfa') {
      steps.push(open)
      open = []
    }
  }
  if (open.length) steps.push(open)
  return steps
}
