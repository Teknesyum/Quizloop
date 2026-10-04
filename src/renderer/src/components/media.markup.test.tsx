// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { DataTable } from './DataTable'
import { Figure } from './Figure'

it('tablo basliklari sutun ve satir kapsamini tasir', () => {
  const html = renderToStaticMarkup(
    <DataTable
      table={{ header: ['Ad', 'Doz'], rows: [['A', '1']], caption: 'Dozlar', rowHeader: true }}
    />
  )
  expect(html).toContain('<caption')
  expect(html).toMatch(/<th scope="col">Ad<\/th><th scope="col">Doz<\/th>/)
  expect(html).toMatch(/<th scope="row">A<\/th><td dir="auto">1<\/td>/)
  expect(html).toContain('tabindex="0"')
})

it('rowHeader yoksa govdede th yoktur', () => {
  const html = renderToStaticMarkup(<DataTable table={{ header: ['Ad'], rows: [['A']] }} />)
  expect(html).not.toContain('scope="row"')
  expect(html).toContain('aria-label=')
})

it('kapali kutu sik metnini gizler, acik kutu gosterir', () => {
  const mark = {
    key: 'A' as const,
    box: [0.1, 0.4, 0.2, 0.2] as [number, number, number, number],
    md: 'Kok',
    state: 'idle' as const,
    disabled: false
  }
  const closed = renderToStaticMarkup(
    <Figure
      src="x.svg"
      alt="Sema"
      masks={[{ box: [0, 0, 0.1, 0.1] }]}
      marks={[{ ...mark, open: false }]}
      onMark={() => undefined}
    />
  )
  expect(closed).toContain('alt="Sema"')
  expect(closed).toMatch(/<button[^>]*class="ql-mark ql-mark-idle[^"]*"/)
  expect(closed).toContain('--ql-bx:10%')
  expect(closed).not.toContain('Kok')
  expect(closed).toMatch(/class="ql-mask"[^>]*>.*\?/)

  const opened = renderToStaticMarkup(
    <Figure src="x.svg" alt="Sema" marks={[{ ...mark, open: true, state: 'right' }]} />
  )
  expect(opened).toContain('ql-mark-right')
  expect(opened).toContain('Kok')
  expect(opened).not.toMatch(/<button[^>]*ql-mark /)
})
