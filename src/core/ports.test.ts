import { describe, expect, it } from 'vitest'
import { normalize } from '@core/modules/loader'
import { joinPath, subtleSha256 } from './ports'

describe('ports', () => {
  it('hashes like node createHash', async () => {
    expect(await subtleSha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
    expect(await subtleSha256(normalize('\ufeffa\r\nb'))).toBe(await subtleSha256('a\nb'))
  })

  it('joins with the root separator', () => {
    expect(joinPath('C:\\mods\\x\\', 'module.json')).toBe('C:\\mods\\x\\module.json')
    expect(joinPath('/data/mods/x', '/blocks/01.json')).toBe('/data/mods/x/blocks/01.json')
    expect(joinPath('/', 'a')).toBe('/a')
  })
})
