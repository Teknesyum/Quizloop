import { describe, expect, it } from 'vitest'
import { baseName, newDefaults } from './defaults'

describe('newDefaults', () => {
  const bundled = ['arapca', 'genel-kultur', 'ingilizce-lite']

  it('adds the new built-ins for an upgrading user', () => {
    expect(newDefaults(bundled, ['genel-kultur', 'quizloop-rehberi'], [], false)).toEqual([
      'arapca',
      'ingilizce-lite'
    ])
  })

  it('leaves a user who removed every built-in alone', () => {
    expect(newDefaults(bundled, ['kendi'], [], false)).toEqual([])
  })

  it('does not bring back a built-in already offered', () => {
    expect(newDefaults(bundled, ['genel-kultur'], bundled, false)).toEqual([])
  })

  it('offers only a later built-in', () => {
    expect(newDefaults([...bundled, 'yeni'], [], bundled, false)).toEqual(['yeni'])
  })

  it('does nothing on first run', () => {
    expect(newDefaults(bundled, [], [], true)).toEqual([])
  })

  it('reads the folder name', () => {
    expect(baseName('C:\\x\\varsayilan\\arapca')).toBe('arapca')
    expect(baseName('/bundled/ingilizce-lite/')).toBe('ingilizce-lite')
  })
})
