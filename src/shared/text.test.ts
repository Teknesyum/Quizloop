import { describe, expect, it } from 'vitest'
import { fold, jaccard, quoteInText, trigrams } from './text'

describe('fold', () => {
  it('drops soft hyphens and line-break hyphenation', () => {
    expect(fold('anes-\ntezi')).toBe('anestezi')
    expect(fold('anes­tezi')).toBe('anestezi')
  })

  it('normalises dashes and quotes', () => {
    expect(fold('a—b')).toBe('a-b')
    expect(fold('“kelime”')).toBe('"kelime"')
  })

  it('lowercases with Turkish rules', () => {
    expect(fold('IŞIK')).toBe('ışık')
    expect(fold('İSTANBUL')).toBe('istanbul')
  })

  it('collapses whitespace', () => {
    expect(fold('  iki   kelime \n')).toBe('iki kelime')
  })
})

describe('quoteInText', () => {
  it('finds a quote across hyphenation and spacing noise', () => {
    const page = 'Kararlılık,   hatırlama olasılığının hedef orana düş-\nmesi için geçen süredir.'
    expect(quoteInText('hatırlama olasılığının hedef orana düşmesi', page)).toBe(true)
  })

  it('rejects text that is not present', () => {
    expect(quoteInText('bulunmayan cümle', 'başka bir metin')).toBe(false)
  })
})

describe('trigrams and jaccard', () => {
  it('scores identical strings as 1', () => {
    expect(jaccard(trigrams('aralıklı tekrar'), trigrams('aralıklı tekrar'))).toBe(1)
  })

  it('scores disjoint strings low', () => {
    expect(jaccard(trigrams('kimya'), trigrams('fizik'))).toBeLessThan(0.2)
  })

  it('treats two empty sets as equal', () => {
    expect(jaccard(new Set(), new Set())).toBe(1)
  })
})
