import { describe, expect, it } from 'vitest'
import { packageAddress, catalogAddress, catalogHost, catalogOf, withoutChannels } from './catalog'

describe('catalog address', () => {
  it('accepts https and trims the fragment', () => {
    expect(catalogAddress('  https://ornek.dev/katalog.json#x ')).toBe(
      'https://ornek.dev/katalog.json'
    )
  })

  it('refuses plain http, other schemes and credentials', () => {
    expect(catalogAddress('http://ornek.dev/katalog.json')).toBeNull()
    expect(catalogAddress('file:///c:/katalog.json')).toBeNull()
    expect(catalogAddress('https://ad:sifre@ornek.dev/katalog.json')).toBeNull()
    expect(catalogAddress('katalog')).toBeNull()
  })

  it('lets a publisher try a catalog on the local machine', () => {
    expect(catalogAddress('http://localhost:4170/katalog.json')).toBe(
      'http://localhost:4170/katalog.json'
    )
    expect(catalogAddress('http://127.0.0.1/katalog.json')).toBe('http://127.0.0.1/katalog.json')
  })

  it('resolves a package beside the catalog file and refuses an unsafe one', () => {
    const catalog = 'https://ornek.dev/yayin/katalog.json'
    expect(packageAddress(catalog, 'a-1.0.0.qlmod')).toBe('https://ornek.dev/yayin/a-1.0.0.qlmod')
    expect(packageAddress(catalog, 'https://baska.dev/a.qlmod')).toBe('https://baska.dev/a.qlmod')
    expect(packageAddress(catalog, 'http://baska.dev/a.qlmod')).toBeNull()
  })

  it('names the host and finds the catalog of a module', () => {
    const catalogs = [
      { url: 'https://ornek.dev/katalog.json', name: 'A', publisher: 'P', channels: ['x', 'y'] }
    ]
    expect(catalogHost(catalogs[0]!.url)).toBe('ornek.dev')
    expect(catalogOf(catalogs, 'y')?.name).toBe('A')
    expect(catalogOf(catalogs, 'z')).toBeUndefined()
    expect(withoutChannels(catalogs, ['x'])[0]!.channels).toEqual(['y'])
  })
})
