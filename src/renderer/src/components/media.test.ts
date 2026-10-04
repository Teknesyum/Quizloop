// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Choice } from '@shared/schema/question'
import {
  altFor,
  boxPlace,
  boxVars,
  clampPan,
  markBoxes,
  maskText,
  nextZoom,
  shortAlt,
  tableModel,
  tableParts,
  tagSide,
  ZOOM_MAX,
  ZOOM_MIN
} from './media'

describe('boxPlace', () => {
  it('normalize kutuyu yuzdeye cevirir', () => {
    expect(boxPlace([0.1, 0.25, 0.5, 0.125])).toEqual({
      left: '10%',
      top: '25%',
      width: '50%',
      height: '12.5%'
    })
  })

  it('gorselin disina tasan kutuyu kirpar', () => {
    expect(boxPlace([0.8, 0.9, 0.5, 0.5])).toEqual({
      left: '80%',
      top: '90%',
      width: '20%',
      height: '10%'
    })
  })

  it('aralik disi ve bozuk sayilari 0..1 icine alir', () => {
    expect(boxPlace([-0.2, Number.NaN, 2, 0.3])).toEqual({
      left: '0%',
      top: '0%',
      width: '100%',
      height: '30%'
    })
  })

  it('css degiskenlerini ayni yuzdelerle verir', () => {
    expect(boxVars([0, 0.5, 0.25, 0.25])).toEqual({
      '--ql-bx': '0%',
      '--ql-by': '50%',
      '--ql-bw': '25%',
      '--ql-bh': '25%'
    })
  })

  it('ustte duran kutunun etiketi alta iner', () => {
    expect(tagSide([0.2, 0.05, 0.1, 0.1])).toBe('below')
    expect(tagSide([0.2, 0.4, 0.1, 0.1])).toBe('above')
  })
})

describe('maskText', () => {
  it('etiket yoksa soru isareti gosterir', () => {
    expect(maskText()).toBe('?')
    expect(maskText('  ')).toBe('?')
    expect(maskText('3')).toBe('3')
  })
})

describe('alt metni', () => {
  it('verilen alt metni korur', () => {
    expect(altFor('Kalp kesiti', 'uzun kok', 'genel')).toBe('Kalp kesiti')
  })

  it('alt yoksa kokun duz metninden uretir', () => {
    expect(altFor(undefined, '**Kalp** ve $x^2$ [bag](http://a)', 'genel')).toBe('Kalp ve x^2 bag')
  })

  it('bos kalirsa genel metne duser', () => {
    expect(altFor(undefined, '![](assets/img/a.png)', 'genel')).toBe('genel')
    expect(altFor('', undefined, 'genel')).toBe('genel')
  })

  it('uzun metni kelime sinirinda keser', () => {
    const md = 'kelime '.repeat(40)
    const s = shortAlt(md)
    expect(s.length).toBeLessThanOrEqual(120)
    expect(s.endsWith('kelime…')).toBe(true)
  })
})

describe('tableModel', () => {
  const header = ['Ilac', 'Doz', 'Sure']

  it('rowHeader yoksa her hucre veri hucresidir', () => {
    const m = tableModel({ header, rows: [['A', '1', '2']] })
    expect(m.rows).toEqual([{ head: null, cells: ['A', '1', '2'] }])
  })

  it('rowHeader varsa ilk hucre satir basligi olur', () => {
    const m = tableModel({ header, rows: [['A', '1', '2']], rowHeader: true })
    expect(m.header).toEqual(header)
    expect(m.rows).toEqual([{ head: 'A', cells: ['1', '2'] }])
  })

  it('kisa satirlari ve basligi en genis satira tamamlar', () => {
    const m = tableModel({ header: ['a', 'b'], rows: [['1'], ['1', '2', '3']] })
    expect(m.header).toEqual(['a', 'b', ''])
    expect(m.rows.map((r) => r.cells)).toEqual([
      ['1', '', ''],
      ['1', '2', '3']
    ])
  })
})

describe('yakinlastirma', () => {
  it('sinirlar icinde kalir', () => {
    expect(nextZoom(ZOOM_MIN, -1)).toBe(ZOOM_MIN)
    expect(nextZoom(ZOOM_MAX, 1)).toBe(ZOOM_MAX)
    expect(nextZoom(1, 1)).toBeGreaterThan(1)
    expect(nextZoom(nextZoom(1, 1), -1)).toBe(1)
  })

  it('kaydirma buyutulmus gorselin disina cikmaz', () => {
    const size = { width: 200, height: 100 }
    expect(clampPan({ x: 500, y: -500 }, 2, size)).toEqual({ x: 100, y: -50 })
    expect(clampPan({ x: 30, y: 10 }, 1, size)).toEqual({ x: 0, y: 0 })
  })
})

describe('markBoxes', () => {
  const choices: Choice[] = [
    { key: 'A', md: 'Aort', box: [0.1, 0.1, 0.1, 0.1] },
    { key: 'B', md: 'Ven', box: [0.5, 0.5, 0.1, 0.1] },
    { key: 'C', md: 'kutusuz' }
  ]

  it('kutusu olmayan sikki atlar', () => {
    expect(markBoxes(choices, { open: false, live: true }).map((m) => m.key)).toEqual(['A', 'B'])
  })

  it('yanlis secilen kutu hata durumu alir ve kilitlenir', () => {
    const [a, b] = markBoxes(choices, { wrong: { A: 'neden' }, open: false, live: true })
    expect(a).toMatchObject({ state: 'wrong', disabled: true, open: false })
    expect(b).toMatchObject({ state: 'idle', disabled: false })
  })

  it('cozulunce kutular acilir ve dogru kutu isaretlenir', () => {
    const [a, b] = markBoxes(choices, { wrong: { A: 'x' }, correct: 'B', open: true, live: false })
    expect(a).toMatchObject({ state: 'wrong', open: true, disabled: true })
    expect(b).toMatchObject({ state: 'right', open: true, md: 'Ven' })
  })
})

describe('tableParts', () => {
  const rows = (n: number): number[] => Array.from({ length: n }, (_, i) => i)

  it('kisa tabloyu bolmez', () => {
    expect(tableParts(rows(8), 2)).toEqual([rows(8)])
  })

  it('uzun iki sutunlu tabloyu yan yana parcalara boler', () => {
    expect(tableParts(rows(9), 2).map((p) => p.length)).toEqual([5, 4])
    expect(tableParts(rows(128), 2).map((p) => p.length)).toEqual([43, 43, 42])
  })

  it('genis tabloyu tek parca birakir', () => {
    expect(tableParts(rows(30), 3).map((p) => p.length)).toEqual([15, 15])
    expect(tableParts(rows(30), 4)).toEqual([rows(30)])
  })

  it('satir sirasini korur', () => {
    expect(tableParts(rows(20), 2).flat()).toEqual(rows(20))
  })
})
