import { describe, expect, it } from 'vitest'
import { unzipSync, type Zippable } from 'fflate'
import { duzle, izListesi, izTara, izsizZip } from './iz.ts'

const yaz = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, 'utf8'))
const IZLER = ['ornekyayinci', 'users\\deneme']

describe('izTara', () => {
  it('finds a trace whatever its case or encoding', () => {
    const genis = new Uint8Array(Buffer.from('yazan: OrnekYayinci', 'utf16le'))
    const bulunan = izTara(
      [
        ['module.json', yaz('{"author":"ORNEKYAYINCI"}')],
        ['assets/a.bin', genis],
        ['blocks/0001.json', yaz('C:\\Users\\Deneme\\Desktop\\kitap.pdf')],
        ['blocks/0002.json', yaz('temiz bir soru')]
      ],
      IZLER
    )
    expect(bulunan).toEqual([
      { dosya: 'module.json', iz: 'ornekyayinci' },
      { dosya: 'assets/a.bin', iz: 'ornekyayinci' },
      { dosya: 'blocks/0001.json', iz: 'users\\deneme' }
    ])
  })

  it('lets the element technetium through but not the bare name', () => {
    const dosyalar: [string, Uint8Array][] = [
      ['blocks/0042.json', yaz('Teknesyum-99m makroagregatlı albümin, teknesyum 99 taraması')],
      ['module.json', yaz('{"author":"Teknesyum"}')]
    ]
    expect(izTara(dosyalar, ['teknesyum'])).toEqual([{ dosya: 'module.json', iz: 'teknesyum' }])
  })

  it('reads file names too', () => {
    expect(izTara([['assets/ornekyayinci-kapak.webp', yaz('x')]], IZLER)).toEqual([
      { dosya: 'assets/ornekyayinci-kapak.webp', iz: 'ornekyayinci' }
    ])
  })
})

describe('duzle', () => {
  it('walks nested folders and option pairs', () => {
    const zip: Zippable = { 'a.json': yaz('1'), assets: { 'b.webp': [yaz('2'), { level: 0 }] } }
    expect([...duzle(zip)].map(([ad]) => ad)).toEqual(['a.json', 'assets/b.webp'])
  })
})

describe('izsizZip', () => {
  it('refuses to write a package that carries a trace', () => {
    expect(() => izsizZip({ 'module.json': yaz('{"by":"ornekyayinci"}') }, IZLER)).toThrow(
      /module\.json: "ornekyayinci"/
    )
  })

  it('packs a clean module unchanged', () => {
    const zip = izsizZip({ 'module.json': yaz('{"id":"ornek"}') }, IZLER)
    expect(Buffer.from(unzipSync(zip)['module.json'] ?? []).toString('utf8')).toBe('{"id":"ornek"}')
  })
})

describe('izListesi', () => {
  it('always looks for the fixed names and drops short entries', () => {
    const izler = izListesi()
    expect(izler).toContain('teknesyum')
    expect(izler.every((s) => s.length >= 4 && s === s.toLocaleLowerCase('en'))).toBe(true)
  })
})
