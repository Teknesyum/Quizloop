import { describe, expect, it } from 'vitest'
import { dalBol, dallar } from './dal'

describe('dalBol', () => {
  it('splits the branch from the chapter name', () => {
    expect(dalBol('Teorik › 09 Sepsis')).toEqual({ dal: 'Teorik', ad: '09 Sepsis' })
  })

  it('leaves a plain chapter alone', () => {
    expect(dalBol('09 Sepsis')).toEqual({ dal: null, ad: '09 Sepsis' })
    expect(dalBol(' › 09')).toEqual({ dal: null, ad: ' › 09' })
  })
})

describe('dallar', () => {
  it('lists branches in first-seen order', () => {
    expect(
      dallar(['Teorik › 01 A', 'Klinik Vaka › 01 A', 'Teorik › 02 B', 'Klinik Vaka › 02 B'])
    ).toEqual(['Teorik', 'Klinik Vaka'])
  })

  it('shows no tabs for a single branch or none', () => {
    expect(dallar(['Teorik › 01 A', 'Teorik › 02 B'])).toEqual([])
    expect(dallar(['01 A', '02 B'])).toEqual([])
  })
})
