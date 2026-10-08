import { describe, expect, it } from 'vitest'
import { moved, ordered, sunk } from './order'

const id = (x: string): string => x

describe('ordered', () => {
  it('keeps the natural order when nothing is saved', () => {
    expect(ordered(['a', 'b', 'c'], id, undefined)).toEqual(['a', 'b', 'c'])
    expect(ordered(['a', 'b', 'c'], id, [])).toEqual(['a', 'b', 'c'])
  })

  it('follows the saved order and appends new rows in natural order', () => {
    expect(ordered(['a', 'b', 'c', 'd'], id, ['c', 'a'])).toEqual(['c', 'a', 'b', 'd'])
  })

  it('ignores saved ids that no longer exist', () => {
    expect(ordered(['a', 'b'], id, ['x', 'b', 'a'])).toEqual(['b', 'a'])
  })
})

describe('sunk', () => {
  it('moves finished rows to the end and keeps the rest in order', () => {
    expect(sunk(['a', 'B', 'c', 'D'], (x) => x === 'B' || x === 'D')).toEqual(['a', 'c', 'B', 'D'])
  })
})

describe('moved', () => {
  it('swaps a row with its neighbour', () => {
    expect(moved(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moved(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b'])
  })

  it('stays put at the edges', () => {
    expect(moved(['a', 'b'], 'a', -1)).toEqual(['a', 'b'])
    expect(moved(['a', 'b'], 'b', 1)).toEqual(['a', 'b'])
  })
})
