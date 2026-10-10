import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { unzipSync, zipSync, type Zippable } from 'fflate'

export interface Iz {
  dosya: string
  iz: string
}

const SABIT = ['teknesyum', 'quizforge']
const MUAF = /teknesyum[\s-]*99/g
const EN_KISA = 4
const SABIT_AN = new Date(2000, 0, 1)
const YEREL = path.resolve(import.meta.dirname, '..', 'iz.yerel.txt')

function git(anahtar: string): string {
  const r = spawnSync('git', ['config', '--get', anahtar], { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : ''
}

function egik(s: string): string[] {
  return [s, s.replaceAll('\\', '/'), s.replaceAll('/', '\\')]
}

export function izListesi(): string[] {
  const kullanici = os.userInfo().username
  const eposta = git('user.email')
  const ek = (process.env['QUIZFORGE_IZ'] ?? '').split(',')
  const yerel = fs.existsSync(YEREL) ? fs.readFileSync(YEREL, 'utf8').split(/\r?\n/) : []
  const ham = [
    ...SABIT,
    git('user.name'),
    eposta,
    eposta.split('@')[0] ?? '',
    os.hostname(),
    ...egik(os.homedir()),
    ...(kullanici ? [`users\\${kullanici}`, `users/${kullanici}`, `home/${kullanici}`] : []),
    ...ek,
    ...yerel
  ]
  const temiz = ham.map((s) => s.trim().toLocaleLowerCase('en')).filter((s) => s.length >= EN_KISA)
  return [...new Set(temiz)]
}

function bicimler(iz: string): string[] {
  const kucuk = iz.toLocaleLowerCase('en')
  return [
    Buffer.from(kucuk, 'utf8').toString('latin1').toLocaleLowerCase('en'),
    Buffer.from(kucuk, 'utf16le').toString('latin1').toLocaleLowerCase('en')
  ]
}

export function izTara(dosyalar: Iterable<[string, Uint8Array]>, izler: string[]): Iz[] {
  const aranan = izler.map((iz) => ({ iz, bicim: bicimler(iz) }))
  const out: Iz[] = []
  for (const [dosya, veri] of dosyalar) {
    const ad = dosya.toLocaleLowerCase('en')
    const metin = Buffer.from(veri.buffer, veri.byteOffset, veri.byteLength)
      .toString('latin1')
      .toLocaleLowerCase('en')
      .replace(MUAF, '')
    for (const a of aranan) {
      if (ad.includes(a.iz) || a.bicim.some((b) => metin.includes(b))) out.push({ dosya, iz: a.iz })
    }
  }
  return out
}

export function* duzle(zip: Zippable, on = ''): Generator<[string, Uint8Array]> {
  for (const [ad, deger] of Object.entries(zip)) {
    const yol = on ? `${on}/${ad}` : ad
    const govde = Array.isArray(deger) ? deger[0] : deger
    if (govde instanceof Uint8Array) yield [yol, govde]
    else yield* duzle(govde, yol)
  }
}

export function izRaporu(izler: Iz[], sinir = 20): string {
  const satir = izler.slice(0, sinir).map((i) => `  ${i.dosya}: "${i.iz}"`)
  const artan = izler.length > sinir ? [`  ve ${izler.length - sinir} iz daha`] : []
  return [...satir, ...artan].join('\n')
}

export function izsizZip(zip: Zippable, izler: string[] = izListesi()): Uint8Array {
  const bulunan = izTara(duzle(zip), izler)
  if (bulunan.length > 0) {
    throw new Error(
      `pakette üreticiye ait iz var, paket yazılmadı (${bulunan.length}):\n${izRaporu(bulunan)}`
    )
  }
  return zipSync(zip, { mtime: SABIT_AN })
}

function paketler(yol: string): string[] {
  if (!fs.statSync(yol).isDirectory()) return [yol]
  return fs
    .readdirSync(yol)
    .filter((f) => f.endsWith('.qlmod'))
    .map((f) => path.join(yol, f))
}

function calistir(yollar: string[]): number {
  if (yollar.length === 0) {
    console.log('kullanım: tsx src/iz.ts <paket.qlmod | klasör> ...')
    return 2
  }
  const izler = izListesi()
  console.log(`aranan iz sayısı: ${izler.length}`)
  let kirli = 0
  for (const p of yollar.flatMap(paketler)) {
    const dosyalar = unzipSync(new Uint8Array(fs.readFileSync(p)))
    const bulunan = izTara(Object.entries(dosyalar), izler)
    const ad = path.basename(p)
    if (bulunan.length === 0) {
      console.log(`temiz  ${ad} (${Object.keys(dosyalar).length} dosya)`)
      continue
    }
    kirli += 1
    console.log(`İZ VAR ${ad} (${bulunan.length}):\n${izRaporu(bulunan)}`)
  }
  return kirli > 0 ? 1 : 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  process.exit(calistir(process.argv.slice(2)))
}
