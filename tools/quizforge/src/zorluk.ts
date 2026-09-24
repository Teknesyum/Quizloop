import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { Loaded } from './rules.ts'
import { loadOutputs, unitsDir, type UnitOutput } from './generate.ts'

export const LEVELS = ['kolay', 'orta', 'zor'] as const
export type Level = (typeof LEVELS)[number]

export const OLCUTLER = {
  K1: 'kolay',
  O1: 'orta',
  O2: 'orta',
  Z1: 'zor',
  Z2: 'zor',
  Z3: 'zor'
} as const satisfies Record<string, Level>

export const ZORLUK_OLCUTU = [
  `Zorluk, kaynağı görmeyen bir uzmanlık adayının soruyu çözmek için yapması gereken işle ölçülür. Bütün sorular kitaptan üretildi; cevabın kitapta yazıyor olması seviyeyi düşürmez. Kota, konu ya da kök uzunluğu seviyeyi belirlemez.`,
  `Kökte ne sorulduğuna bak, sonra en zordan başla; ilk uyan ölçüt seviyeyi verir:`,
  `Z1 zor: çok adımlı klinik akıl yürütme — vakadaki bulguları yorumla, bir mekanizmaya ya da tanıya bağla, ondan karar çıkar. Adımlardan biri atlanırsa cevap bulunmaz.`,
  `Z2 zor: iki ya da daha fazla ayrı bilgiyi birleştirmek gerekir (ilacın farmakokinetiği ile hastanın hastalığı, iki fizyolojik etkinin net sonucu).`,
  `Z3 zor: doğru cevap birbirine çok yakın, hepsi akla yatkın şıklardan ince bir ayrımla ya da bir istisnayı bilerek seçilir ("hangisi değildir" tipi, her şık gerçek bir olgu).`,
  `O1 orta: tek adımlı çıkarım — "neden, hangi mekanizmayla, sonucu ne olur" sorusu; bir olgudan diğerine bir adım.`,
  `O2 orta: vakadaki bir veriyi (değer, bulgu, hasta özelliği) tek bir kurala, eşiğe, doza ya da endikasyona uygulamak.`,
  `K1 kolay: tek bir olguyu doğrudan hatırlamak — tanım, isim, sayı, yıl, sınıf, tek özellik. Soru "X nedir / hangisidir / kaçtır" diye tek bir ezber bilgiyi istiyor.`,
  `Vaka kılıfı: vakadaki veriler cevap için gerçekten kullanılıyorsa kılıf gerçektir (en az O2). Kılıf süsse, yani silince soru değişmiyorsa, kalan soruya göre ölç.`,
  `Açık uçlu sorularda beklenen cevabın ne kadar çıkarım istediğine bak.`
].join('\n')

export const ANCHORS = [
  `K1 örnek: "Anestezi terimini 1846'da amnezi, analjezi ve narkozu kapsayacak şekilde ilk kullanan kimdir?" — tek ezber bilgi (isim). Vaka kılıfıyla sorulsa da K1.`,
  `O1 örnek: "Süksinilkolin sonrası hiperkaleminin mekanizması nedir?" — tek mekanizmadan sonuç.`,
  `O2 örnek: "Kreatinin klirensi 25 mL/dk olan hastada enoksaparin dozu nasıl ayarlanır?" — tek kuralı uygulamak.`,
  `Z1 örnek: "Laparoskopi sırasında ETCO2 aniden düşen, hipotansif ve taşikardik hastada ilk yapılacak nedir?" — bulgu → mekanizma (CO2 embolisi) → karar.`,
  `Z2 örnek: "Karaciğer yetmezliği olan ve uzun süreli infüzyon alan hastada hangi nöromüsküler blokerin etkisi en az uzar?" — farmakokinetik + hastalık.`,
  `Z3 örnek: "Aşağıdakilerden hangisi malign hipertermiyi tetiklemez?" şıkların hepsi volatil ajan ve süksinilkolin, biri azot protoksit — istisna.`
].join('\n')

export interface Item {
  id: string
  tip: string
  kok: string
  siklar?: string[]
  dogru?: string
  beklenenCevap?: string
}

export const Label = z.object({
  id: z.string(),
  zorluk: z.enum(LEVELS),
  olcut: z.enum(Object.keys(OLCUTLER) as [keyof typeof OLCUTLER, ...(keyof typeof OLCUTLER)[]])
})
export type LabelT = z.infer<typeof Label>

export function zorlukDir(l: Loaded): string {
  return path.join(l.buildDir, 'zorluk')
}

export function toItem(q: UnitOutput['questions'][number]): Item {
  const it: Item = {
    id: q.id,
    tip: q.kind,
    kok: q.stem.md
  }
  if (q.choices.length) {
    it.siklar = q.choices.map((c) => `${c.key}) ${c.md}`)
    it.dogru = q.correct
  }
  if (q.beklenenCevap) it.beklenenCevap = q.beklenenCevap
  return it
}

export function labelPrompt(batch: string, out: string): string {
  return [
    `Görev: ${batch} dosyasındaki anestezi uzmanlık sınavı sorularının her birine zorluk etiketi ver.`,
    `Her soruyu kendin oku ve karar ver; script, anahtar kelime kuralı ya da alt ajan kullanma.`,
    '',
    ZORLUK_OLCUTU,
    '',
    ANCHORS,
    '',
    `Çıktı: ${out} dosyasına, girişteki her soru için bir satır içeren bir JSON dizisi yaz: [{"id": "...", "zorluk": "kolay"|"orta"|"zor", "olcut": "K1"|"O1"|"O2"|"Z1"|"Z2"|"Z3"}]. olcut ile zorluk tutarlı olmalı (K→kolay, O→orta, Z→zor). Hiçbir soruyu atlama, id'leri değiştirme.`
  ].join('\n')
}

export function exportBatches(l: Loaded, size = 100): string[] {
  const items = loadOutputs(l).flatMap((u) => u.questions.map(toItem))
  const dir = zorlukDir(l)
  fs.rmSync(path.join(dir, 'in'), { recursive: true, force: true })
  fs.mkdirSync(path.join(dir, 'in'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true })
  const files: string[] = []
  for (let i = 0; i * size < items.length; i++) {
    const n = String(i + 1).padStart(3, '0')
    const f = path.join(dir, 'in', `${n}.json`)
    fs.writeFileSync(f, JSON.stringify(items.slice(i * size, (i + 1) * size), null, 1))
    files.push(f)
  }
  fs.writeFileSync(
    path.join(dir, 'istem.md'),
    `${labelPrompt('build/zorluk/in/NNN.json', 'build/zorluk/out/NNN.json')}\n`
  )
  return files
}

export function readLabels(dir: string): Map<string, LabelT> {
  const map = new Map<string, LabelT>()
  if (!fs.existsSync(dir)) return map
  for (const n of fs
    .readdirSync(dir)
    .filter((x) => x.endsWith('.json'))
    .sort()) {
    const rows = z.array(Label).parse(JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')))
    for (const r of rows) {
      if (OLCUTLER[r.olcut] !== r.zorluk)
        throw new Error(`${n}: ${r.id} ölçüt ${r.olcut} ile zorluk ${r.zorluk} uyuşmuyor`)
      map.set(r.id, r)
    }
  }
  return map
}

export interface ApplyResult {
  total: number
  missing: string[]
  unknown: string[]
  changed: number
  matrix: Record<Level, Record<Level, number>>
  after: Record<Level, number>
  olcut: Record<string, number>
}

export function applyLabels(l: Loaded, labels: Map<string, LabelT>, dryRun = false): ApplyResult {
  const zero = (): Record<Level, number> => ({ kolay: 0, orta: 0, zor: 0 })
  const r: ApplyResult = {
    total: 0,
    missing: [],
    unknown: [],
    changed: 0,
    matrix: { kolay: zero(), orta: zero(), zor: zero() },
    after: zero(),
    olcut: {}
  }
  const seen = new Set<string>()
  const dir = unitsDir(l)
  const writes: [string, UnitOutput][] = []
  const files = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((n) => n.endsWith('.json'))
        .sort()
    : []
  for (const n of files) {
    const f = path.join(dir, n)
    const u = JSON.parse(fs.readFileSync(f, 'utf8')) as UnitOutput
    let dirty = false
    for (const q of u.questions) {
      r.total++
      seen.add(q.id)
      const lab = labels.get(q.id)
      if (!lab) {
        r.missing.push(q.id)
        continue
      }
      r.matrix[q.difficulty as Level][lab.zorluk]++
      r.after[lab.zorluk]++
      r.olcut[lab.olcut] = (r.olcut[lab.olcut] ?? 0) + 1
      if (q.difficulty !== lab.zorluk) {
        q.difficulty = lab.zorluk
        r.changed++
        dirty = true
      }
    }
    if (dirty) writes.push([f, u])
  }
  for (const id of labels.keys()) if (!seen.has(id)) r.unknown.push(id)
  if (!dryRun && r.missing.length === 0 && r.unknown.length === 0)
    for (const [f, u] of writes) fs.writeFileSync(f, JSON.stringify(u, null, 1))
  return r
}

export function formatApply(r: ApplyResult, dryRun: boolean): string {
  const pct = (n: number): string => `${((n / r.total) * 100).toFixed(1)}%`
  const lines = [
    `${r.total} soru, ${r.changed} etiket değişti${dryRun ? ' (deneme, yazılmadı)' : ''}`,
    `eski → yeni       kolay   orta    zor`,
    ...LEVELS.map(
      (a) => `  ${a.padEnd(15)}` + LEVELS.map((b) => String(r.matrix[a][b]).padStart(6)).join(' ')
    ),
    `yeni dağılım: ${LEVELS.map((k) => `${k} ${r.after[k]} (${pct(r.after[k])})`).join(', ')}`,
    `ölçüt: ${Object.entries(r.olcut)
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')}`
  ]
  if (r.missing.length)
    lines.push(`etiketsiz ${r.missing.length}: ${r.missing.slice(0, 5).join(', ')}`)
  if (r.unknown.length)
    lines.push(`bilinmeyen ${r.unknown.length}: ${r.unknown.slice(0, 5).join(', ')}`)
  return lines.join('\n')
}

export function agreement(
  a: Map<string, LabelT>,
  b: Map<string, LabelT>
): {
  n: number
  same: number
  adjacent: number
  far: number
} {
  const rank = (x: Level): number => LEVELS.indexOf(x)
  let n = 0
  let same = 0
  let adjacent = 0
  let far = 0
  for (const [id, y] of b) {
    const x = a.get(id)
    if (!x) continue
    n++
    const d = Math.abs(rank(x.zorluk) - rank(y.zorluk))
    if (d === 0) same++
    else if (d === 1) adjacent++
    else far++
  }
  return { n, same, adjacent, far }
}
