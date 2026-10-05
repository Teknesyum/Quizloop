import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { zipSync, type Zippable } from 'fflate'
import { ModuleMeta, type BookPart } from '../../../../src/shared/schema/module.ts'
import { Block } from '../../../../src/shared/schema/question.ts'
import { sha256 } from '../hash.ts'
import {
  MEAL_KIMLIK,
  MUSHAF_SURUM,
  caprazDenetle,
  kitapYukle,
  mealYukle,
  mushafYukle,
  type Meal
} from './kaynak.ts'
import { uret, type Satir } from './uret.ts'

const MODUL = 'kuran-hafizlik'
const SURUM = '1.7.0'
const DONUS_NOTU =
  'Dönüş, her cüzün son sayfasından başa doğru sayılır: 1. Dönüş son sayfadır, 20. Dönüş ilk sayfadır. 30. Cüz 24 sayfadır; son beş sayfası (600-604) 1. Dönüş sayılır.'
const BLOK = 50
const IMLA_FARKI = new Set(['21:88', '63:10', '72:16'])
const MEAL_ADLARI: Record<number, string> = { 77: 'Diyanet İşleri', 52: 'Elmalılı Hamdi Yazır' }

export const HAFIZLIK_HELP = `quizforge hafizlik [seçenekler]

  Kur'an hafızlık sağlama modülünü üretir: modules/${MODUL}/
  Metin, meal ve mushaf sayfaları bu bilgisayara indirilir, depoya girmez.
  Bölümler 30 cüzdür; dönüş yalnız açıklamalarda bilgi olarak yazar.

  --kitapsiz      mushaf sayfalarını pakete koyma ("Kuran'da gör" çalışmaz)

  --cuz <a|a-b>   yalnız bu cüzler (varsayılan 1-30)
  --meal <no>     quran.com meal kimliği (varsayılan ${MEAL_KIMLIK}, Diyanet İşleri)
  --mealsiz       meal indirme, çözümde yalnız Arapça göster
  --siksiz        şıksız üret: parça gösterilir, kullanıcı kendini puanlar
  --en-az <n>     bir parçadaki en az kelime (varsayılan 3)
`

function cuzAraligi(v: string | undefined): Set<number> | undefined {
  if (!v) return undefined
  const m = v.match(/^(\d+)(?:-(\d+))?$/)
  if (!m) throw new Error('--cuz 3 ya da --cuz 1-5 biçiminde olmalı')
  const a = Number(m[1])
  const b = Number(m[2] ?? m[1])
  if (a < 1 || b > 30 || a > b) throw new Error('--cuz 1 ile 30 arasında olmalı')
  return new Set(Array.from({ length: b - a + 1 }, (_x, i) => a + i))
}

export async function hafizlik(argv: string[], root: string): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      cuz: { type: 'string' },
      kitapsiz: { type: 'boolean', default: false },
      meal: { type: 'string' },
      mealsiz: { type: 'boolean', default: false },
      siksiz: { type: 'boolean', default: false },
      'en-az': { type: 'string' },
      help: { type: 'boolean', default: false }
    }
  })
  if (values.help) {
    process.stdout.write(HAFIZLIK_HELP)
    return 0
  }
  const buildDir = path.join(root, 'sources', MODUL, 'build')
  const sureler = await mushafYukle(buildDir)
  console.log('mushaf: 114 sure, 6236 ayet, sağlama toplamı tuttu')
  let meal: Meal | null = null
  if (!values.mealsiz) {
    const no = Number(values.meal ?? MEAL_KIMLIK)
    meal = await mealYukle(buildDir, no, (n) => {
      if (n % 19 === 0) console.log(`kelime meali: ${n}/114 sure`)
    })
    meal.ad = MEAL_ADLARI[no] ?? meal.ad
    const c = caprazDenetle(sureler, meal)
    const beklenmeyen = c.kokFarki.filter((k) => !IMLA_FARKI.has(k))
    fs.writeFileSync(path.join(buildDir, 'capraz.json'), JSON.stringify(c, null, 1))
    if (beklenmeyen.length)
      throw new Error(`ikinci kaynakla harf farkı: ${beklenmeyen.slice(0, 10).join(', ')}`)
    console.log(
      `çapraz denetim: ${c.ayet - c.kokFarki.length}/${c.ayet} ayet harfi harfine aynı, ${c.kokFarki.length} bilinen imla farkı; kelime sayısı ${c.kelimeEsit} ayette eşit`
    )
  }
  const python = process.platform === 'win32' ? 'python' : 'python3'
  const pyDir = path.join(root, 'tools', 'quizforge', 'py')
  const kitap = values.kitapsiz ? null : await kitapYukle(buildDir)
  let satirlar: Record<string, Satir[]> | undefined
  if (kitap) {
    const py = spawnSync(python, [path.join(pyDir, 'hafizlik_satir.py'), kitap], {
      encoding: 'utf8',
      maxBuffer: 1 << 26
    })
    if (py.status !== 0)
      throw new Error(
        `mushaf satırları okunamadı: ${(py.stderr || py.error?.message || '').trim()}`
      )
    satirlar = JSON.parse(py.stdout) as Record<string, Satir[]>
    console.log(`mushaf satırları: ${Object.keys(satirlar).length} ayetin yeri bulundu`)
  }
  const r = uret(sureler, meal, {
    satirlar,
    cuzler: cuzAraligi(values.cuz),
    sikli: !values.siksiz,
    enAz: values['en-az'] ? Number(values['en-az']) : undefined
  })
  const outDir = path.join(root, 'modules', MODUL)
  const blocksDir = path.join(outDir, 'blocks')
  fs.rmSync(blocksDir, { recursive: true, force: true })
  fs.mkdirSync(blocksDir, { recursive: true })
  const blocks: { file: string; count: number; sha256: string }[] = []
  const zip: Zippable = {}
  let bayt = 0
  for (let i = 0; i < r.sorular.length; i += BLOK) {
    const blockId = String(blocks.length + 1).padStart(4, '0')
    const block = Block.parse({ blockId, questions: r.sorular.slice(i, i + BLOK) })
    const data = JSON.stringify(block)
    const file = `blocks/${blockId}.json`
    fs.writeFileSync(path.join(outDir, file), data)
    zip[file] = [Buffer.from(data), { level: 6 }]
    bayt += Buffer.byteLength(data)
    blocks.push({ file, count: block.questions.length, sha256: sha256(data) })
  }
  const bolumler: BookPart[] = []
  if (kitap) {
    const bolumDir = path.join(buildDir, 'bolum')
    const py = spawnSync(python, [path.join(pyDir, 'hafizlik_kitap.py'), kitap, bolumDir], {
      encoding: 'utf8'
    })
    if (py.status !== 0)
      throw new Error(`mushaf PDF bölünemedi: ${(py.stderr || py.error?.message || '').trim()}`)
    const parcalar = JSON.parse(py.stdout) as (Omit<BookPart, 'dosya'> & { ad: string })[]
    fs.rmSync(path.join(outDir, 'kaynak'), { recursive: true, force: true })
    for (const x of parcalar) {
      const dosya = `kaynak/bolum/${x.ad}`
      const veri = fs.readFileSync(path.join(bolumDir, x.ad))
      const hedef = path.join(outDir, dosya)
      fs.mkdirSync(path.dirname(hedef), { recursive: true })
      fs.writeFileSync(hedef, veri)
      zip[dosya] = [veri, { level: 0 }]
      bolumler.push({ bolum: x.bolum, ilkSayfa: x.ilkSayfa, sonSayfa: x.sonSayfa, dosya })
    }
  }
  const meta = ModuleMeta.parse({
    schemaVersion: 1,
    id: MODUL,
    name: "Kur'an-ı Kerim Hafızlık Sağlama",
    version: SURUM,
    language: 'tr',
    description: `Bir parça gösterilir, devamı ezberden okunur. Parçalar Diyanet mushafının secavend duraklarına göre bölünmüştür. Bölümler cüz sırasıyladır. ${DONUS_NOTU}`,
    tags: ['kuran', 'hafizlik'],
    source: {
      title: `Diyanet mushafı (kuran.diyanet.gov.tr), alperenugus/Kuran@${MUSHAF_SURUM.slice(0, 7)}, CC BY 4.0`,
      ...(bolumler.length ? { pages: 604, sayfaOfseti: 0, sagdanSola: true, bolumler } : {})
    },
    blocks,
    questionCount: r.sorular.length,
    createdAt: new Date().toISOString()
  })
  fs.rmSync(path.join(outDir, 'assets'), { recursive: true, force: true })
  const kapakDir = path.join(root, 'tools', 'quizforge', 'src', 'hafizlik', 'kapak')
  const gorseller = ['kapak.webp', ...Array.from({ length: 30 }, (_x, i) => `bolum/${i + 1}.webp`)]
  for (const g of gorseller) {
    const veri = fs.readFileSync(path.join(kapakDir, g))
    const hedef = path.join(outDir, 'assets', g)
    fs.mkdirSync(path.dirname(hedef), { recursive: true })
    fs.writeFileSync(hedef, veri)
    zip[`assets/${g}`] = [veri, { level: 0 }]
  }
  const metaJson = JSON.stringify(meta, null, 1)
  fs.writeFileSync(path.join(outDir, 'module.json'), metaJson)
  zip['module.json'] = [Buffer.from(metaJson), { level: 6 }]
  const paketDir = path.join(root, 'dist', 'modules')
  fs.mkdirSync(paketDir, { recursive: true })
  const paket = path.join(paketDir, `quizloop-${MODUL}-${meta.version}.qlmod`)
  const sikisik = zipSync(zip)
  fs.writeFileSync(paket, sikisik)
  console.log(
    `${r.sorular.length} soru (${r.sikli} çoktan seçmeli, ${r.mutesabih} tanesi benzer ayetli; ${r.acik} açık uçlu), ${blocks.length} blok, ${(bayt / 1048576).toFixed(1)} MB`
  )
  console.log(`bağlam eklenen gövde: ${r.baglamli}, sure adıyla ayrılan: ${r.belirsiz}`)
  console.log('yazıldı: ' + path.relative(root, outDir))
  console.log(`paket: ${path.relative(root, paket)} (${(sikisik.length / 1048576).toFixed(1)} MB)`)
  return 0
}
