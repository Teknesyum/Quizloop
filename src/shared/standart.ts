import type { Question } from './schema/question'

export const STANDART = '1.1.0'

export const BOLGE_STANDART = '1.1.0'

function parts(v: string): number[] {
  return v.split('.').map((n) => Number.parseInt(n, 10) || 0)
}

export function compareStandart(a: string, b: string): number {
  const x = parts(a)
  const y = parts(b)
  for (let i = 0; i < 3; i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

export function atLeast(have: string | undefined, need: string): boolean {
  return have !== undefined && compareStandart(have, need) >= 0
}

export function bookImages(q: Question): number {
  let n = 0
  if (q.stem.bolge && !q.stem.imageRef) n++
  for (const c of q.choices) if (c.bolge && !c.imageRef) n++
  for (const b of [...q.solution, ...(q.anlatim ?? [])])
    if (b.type === 'image' && b.bolge && !b.ref) n++
  return n
}

export function emptyImages(q: Question): number {
  let n = 0
  for (const b of [...q.solution, ...(q.anlatim ?? [])])
    if (b.type === 'image' && !b.bolge && !b.ref) n++
  return n
}
