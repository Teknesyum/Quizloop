import { describe, expect, it } from 'vitest'
import { bookLocative, findQuoteRuns, normalizeQuote, pdfPageOf, spreadOf } from './kaynak'

describe('pdfPageOf', () => {
  it('adds the module offset', () => {
    expect(pdfPageOf(14, 21)).toBe(35)
    expect(pdfPageOf(14)).toBe(14)
  })
})

describe('spreadOf', () => {
  it('opens an even page with its successor', () => {
    expect(spreadOf(14)).toEqual([14, 15])
  })

  it('pulls an odd page onto the right side', () => {
    expect(spreadOf(15)).toEqual([14, 15])
  })

  it('never falls below the first leaf', () => {
    expect(spreadOf(1)).toEqual([1, 2])
  })
})

describe('normalizeQuote', () => {
  it('folds whitespace, dashes and case', () => {
    expect(normalizeQuote('Genel  ANESTEZİ\nderinliği')).toBe('genel anestezi derinliği')
  })

  it('rejoins a hyphen broken across lines', () => {
    expect(normalizeQuote('anes-\ntezi')).toBe('anestezi')
  })
})

describe('findQuoteRuns', () => {
  const runs = ['Genel anestezi', 'derinliği bispektral', 'indeks ile izlenir.']

  it('marks every run the quote touches', () => {
    const hit = findQuoteRuns(runs, 'anestezi derinliği bispektral')
    expect(hit?.runs).toEqual([0, 1])
  })

  it('falls back to a shorter probe when the tail drifts', () => {
    const hit = findQuoteRuns(runs, 'Genel anestezi derinliği bispektral indeks ile izlenir ve')
    expect(hit?.runs).toEqual([0, 1, 2])
    expect(hit?.probe.length).toBeLessThan(60)
  })

  it('ignores spaces the scan put inside words and numbers', () => {
    const hit = findQuoteRuns(
      ['Eter 1 842', "'de Craw ford W. Long"],
      "Eter 1842'de Crawford W. Long"
    )
    expect(hit?.runs).toEqual([0, 1])
  })

  it('finds the tail when the head drifts', () => {
    const hit = findQuoteRuns(runs, 'Lokal anestezi derinliği bispektral indeks ile izlenir.')
    expect(hit?.runs).toEqual([1, 2])
  })

  it('returns nothing when the page does not carry the quote', () => {
    expect(findQuoteRuns(runs, 'kardiyopulmoner baypas')).toBeNull()
  })
})

describe('bookLocative', () => {
  it('names the book from its file with the Turkish locative suffix', () => {
    expect(bookLocative('LANGE 7. BASKI.pdf')).toBe("Lange'de")
    expect(bookLocative('kitaplar/Guyton.pdf')).toBe("Guyton'da")
    expect(bookLocative('Harrison.pdf')).toBe("Harrison'da")
    expect(bookLocative('Robbins Patoloji.pdf')).toBe("Robbins'te")
    expect(bookLocative('Netter.pdf')).toBe("Netter'de")
    expect(bookLocative('Cecil.pdf')).toBe("Cecil'de")
    expect(bookLocative('Stoelting.pdf')).toBe("Stoelting'de")
    expect(bookLocative('Miller Anestezi.pdf')).toBe("Miller'de")
    expect(bookLocative('Barash Klinik.pdf')).toBe("Barash'ta")
    expect(bookLocative('123.pdf')).toBeNull()
  })
})
