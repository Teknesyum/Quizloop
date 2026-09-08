const SOFT_BREAKS = /[\u00ad]|-\r?\n\s*/g
const DASHES = /[\u2010-\u2015\u2212]/g
const QUOTES = /[\u2018\u2019\u201a\u201b]/g
const DQUOTES = /[\u201c\u201d\u201e\u201f\u00ab\u00bb]/g
const SPACES = /[\s\u00a0\u202f]+/g

export function fold(input: string): string {
  return input
    .normalize('NFC')
    .replace(SOFT_BREAKS, '')
    .replace(DASHES, '-')
    .replace(QUOTES, "'")
    .replace(DQUOTES, '"')
    .toLocaleLowerCase('tr')
    .replace(SPACES, ' ')
    .trim()
}

export function quoteInText(quote: string, text: string): boolean {
  return fold(text).includes(fold(quote))
}

export function trigrams(input: string): Set<string> {
  const s = fold(input).replace(/[^\p{L}\p{N} ]/gu, '')
  const out = new Set<string>()
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3))
  return out
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}
