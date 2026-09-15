export function pdfPageOf(bookPage: number, offset = 0): number {
  return bookPage + offset
}

export function spreadOf(bookPage: number): [number, number] {
  const left = bookPage % 2 === 0 ? bookPage : bookPage - 1
  return [Math.max(1, left), Math.max(2, left + 1)]
}

export function normalizeQuote(input: string): string {
  return input
    .replace(/­/g, '')
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/-\s*\n\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr')
}

export interface QuoteHit {
  runs: number[]
  probe: string
}

function probes(quote: string): string[] {
  const words = quote.split(' ').filter(Boolean)
  const out = [quote]
  for (const n of [12, 8, 5, 3]) {
    if (words.length > n) out.push(words.slice(0, n).join(' '))
  }
  return out
}

export function findQuoteRuns(runs: string[], quote: string): QuoteHit | null {
  const needle = normalizeQuote(quote)
  if (!needle) return null
  let flat = ''
  const owner: number[] = []
  runs.forEach((run, i) => {
    const piece = normalizeQuote(run)
    if (!piece) return
    if (flat) {
      flat += ' '
      owner.push(i)
    }
    for (let c = 0; c < piece.length; c++) owner.push(i)
    flat += piece
  })
  if (!flat) return null
  for (const probe of probes(needle)) {
    const at = flat.indexOf(probe)
    if (at === -1) continue
    const hit = new Set<number>()
    for (let c = at; c < at + probe.length && c < owner.length; c++) {
      const own = owner[c]
      if (own !== undefined) hit.add(own)
    }
    return { runs: [...hit].sort((a, b) => a - b), probe }
  }
  return null
}
