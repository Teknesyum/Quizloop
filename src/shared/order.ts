export const LIBRARY_ORDER = '*'

export function ordered<T>(rows: T[], id: (row: T) => string, order: string[] | undefined): T[] {
  if (!order?.length) return rows
  const rank = new Map(order.map((key, i) => [key, i]))
  return rows
    .map((row, i) => ({ row, at: rank.get(id(row)) ?? order.length + i }))
    .sort((a, b) => a.at - b.at)
    .map((x) => x.row)
}

export function moved(ids: string[], id: string, step: -1 | 1): string[] {
  const from = ids.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= ids.length) return ids
  const next = [...ids]
  next[from] = ids[to] as string
  next[to] = id
  return next
}
