import fs from 'node:fs'
import path from 'node:path'
import type { Loaded } from './rules.ts'

export interface Page {
  pdfPage: number
  bookPage: number | null
  chapter: number | null
  text: string
}

export interface Chapter {
  chapter: number
  title: string
  pdfPages: [number, number]
  bookPages: [number, number]
}

export interface Corpus {
  pages: Map<number, Page>
  chapters: Chapter[]
  sha256: string
  file: string
  pageOffset: number
}

const HEADER = /^\s*(\d{1,4}\s+KISIM\b.*|BÖLÜM\s+\d{1,2}\s+.*\s\d{1,4})\s*$/

export function loadCorpus(l: Loaded): Corpus {
  const pagesFile = path.resolve(l.root, l.rules.kaynak.kulliyat)
  const mapFile = path.resolve(l.root, l.rules.kaynak.bolumHaritasi)
  const pages = new Map<number, Page>()
  for (const line of fs.readFileSync(pagesFile, 'utf8').split('\n')) {
    if (!line.trim()) continue
    const p = JSON.parse(line) as Page
    pages.set(p.pdfPage, p)
  }
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8')) as {
    sha256: string
    file: string
    pageOffset: number
    chapters: Chapter[]
  }
  return {
    pages,
    chapters: map.chapters,
    sha256: map.sha256,
    file: map.file,
    pageOffset: map.pageOffset
  }
}

export function bodyText(p: Page): string {
  const lines = p.text.split('\n')
  if (lines[0] !== undefined && HEADER.test(lines[0])) lines.shift()
  return lines.join('\n')
}

export function toShown(l: Loaded, c: Corpus, pdfPage: number): number {
  return l.rules.kaynak.sayfaNumarasi === 'kitap' ? pdfPage - c.pageOffset : pdfPage
}

export function toPdf(l: Loaded, c: Corpus, shown: number): number {
  return l.rules.kaynak.sayfaNumarasi === 'kitap' ? shown + c.pageOffset : shown
}

export function unitText(l: Loaded, c: Corpus, a: number, b: number): string {
  const out: string[] = []
  for (let i = a; i <= b; i++) {
    const p = c.pages.get(i)
    if (p) out.push(`[[sayfa ${i}]]\n${bodyText(p)}`)
  }
  return out.join('\n\n')
}

export function rangeText(c: Corpus, a: number, b: number): string {
  const out: string[] = []
  for (let i = a; i <= b; i++) {
    const p = c.pages.get(i)
    if (p) out.push(p.text)
  }
  return out.join('\n')
}
