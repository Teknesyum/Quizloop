export const DAL_AYRACI = ' › '

export function dalBol(chapter: string): { dal: string | null; ad: string } {
  const at = chapter.indexOf(DAL_AYRACI)
  if (at <= 0) return { dal: null, ad: chapter }
  return { dal: chapter.slice(0, at).trim(), ad: chapter.slice(at + DAL_AYRACI.length).trim() }
}

export function dallar(chapters: string[]): string[] {
  const out: string[] = []
  for (const c of chapters) {
    const { dal } = dalBol(c)
    if (dal && !out.includes(dal)) out.push(dal)
  }
  return out.length > 1 ? out : []
}
