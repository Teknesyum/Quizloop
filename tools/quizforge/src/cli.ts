import { parseArgs } from 'node:util'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRules } from './rules.ts'
import { loadCorpus } from './corpus.ts'
import { buildPlan, loadPlan, savePlan } from './plan.ts'
import { PRICES, run } from './generate.ts'
import { loadCheckpoint } from './checkpoint.ts'
import { verify } from './verify.ts'
import { pack } from './pack.ts'
import { writeBriefs, briefDir } from './brief.ts'
import { ingest } from './ingest.ts'

const HELP = `quizforge <komut> --rules <rules.yaml> [seçenekler]

  init      PDF metin katmanını çıkar: sources/<id>/pages.jsonl + chapters.json
  plan      bölüm haritasından üretim birimlerini çıkar: build/plan.json
  run       birimleri modele gönder   --max-usd <n> zorunlu, --model, --limit, --chapter, --dry-run
  brief     birim istemlerini dosyaya yaz (alt ajanla üretim için)   --chapter, --limit
  ingest    ajanların yazdığı build/raw/*.json dosyalarını soruya çevir
  verify    deterministik denetim: build/verify-report.json
  pack      modules/<id>/ yaz; verify geçmeden çalışmaz
  doctor    ortamı sına: python, pypdf, ANTHROPIC_API_KEY, külliyat dosyaları
`

const here = path.dirname(fileURLToPath(import.meta.url))

function python(): string {
  return process.platform === 'win32' ? 'python' : 'python3'
}

function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      rules: { type: 'string' },
      'max-usd': { type: 'string' },
      model: { type: 'string', default: 'claude-opus-5' },
      limit: { type: 'string' },
      chapter: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false }
    }
  })
  const cmd = positionals[0]
  if (!cmd || values.help) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }
  if (!values.rules) throw new Error('--rules <dosya> gerekli')
  const l = loadRules(values.rules)

  if (cmd === 'doctor') {
    const py = spawnSync(
      python(),
      ['-c', 'import pypdf,sys;print(sys.version.split()[0], pypdf.__version__)'],
      { encoding: 'utf8' }
    )
    console.log(
      `python+pypdf: ${py.status === 0 ? py.stdout.trim() : 'YOK (' + (py.stderr || py.error?.message || '').trim().split('\n').pop() + ')'}`
    )
    console.log(`ANTHROPIC_API_KEY: ${process.env['ANTHROPIC_API_KEY'] ? 'var' : 'YOK'}`)
    for (const f of [l.rules.kaynak.yol, l.rules.kaynak.kulliyat, l.rules.kaynak.bolumHaritasi]) {
      console.log(`${f}: ${fs.existsSync(path.resolve(l.root, f)) ? 'var' : 'YOK'}`)
    }
    console.log(`fiyat tablosu: ${Object.keys(PRICES).join(', ')}`)
    return 0
  }

  if (cmd === 'init') {
    const pdf = path.resolve(l.root, l.rules.kaynak.yol)
    const r = spawnSync(
      python(),
      ['-X', 'utf8', path.join(here, '..', 'py', 'extract.py'), pdf, l.dir],
      { encoding: 'utf8', stdio: 'inherit' }
    )
    if (r.status !== 0) throw new Error('extract.py başarısız')
    const c = loadCorpus(l)
    if (l.rules.kaynak.sha256 && l.rules.kaynak.sha256 !== c.sha256)
      throw new Error(`sha256 uyuşmuyor: rules ${l.rules.kaynak.sha256} ≠ pdf ${c.sha256}`)
    return 0
  }

  const c = loadCorpus(l)

  if (cmd === 'plan') {
    const plan = buildPlan(l, c)
    savePlan(l, plan)
    const sizes = plan.units.map((u) => u.pages[1] - u.pages[0] + 1)
    console.log(
      `${plan.units.length} birim, sayfa/birim min ${Math.min(...sizes)} max ${Math.max(...sizes)} ort ${(sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(1)}, toplam ${plan.units.reduce((a, u) => a + u.chars, 0)} karakter → ${path.relative(l.root, path.join(l.buildDir, 'plan.json'))}`
    )
    return 0
  }

  if (cmd === 'run') {
    const plan = loadPlan(l)
    const dryRun = values['dry-run']
    const maxUsd = Number(values['max-usd'])
    if (!dryRun && !(maxUsd > 0)) throw new Error('--max-usd <n> zorunlu')
    if (!dryRun && !process.env['ANTHROPIC_API_KEY']) throw new Error('ANTHROPIC_API_KEY yok')
    const chapter = values.chapter !== undefined ? Number(values.chapter) : undefined
    const limit = values.limit !== undefined ? Number(values.limit) : undefined
    run(l, c, plan, { model: values.model, maxUsd, limit, chapter, dryRun })
      .then((cp) => {
        const done = Object.values(cp.units).filter((u) => u.status === 'done').length
        const failed = Object.values(cp.units).filter((u) => u.status === 'failed').length
        console.log(
          `biten ${done}/${plan.units.length}, hatalı ${failed}, giriş ${cp.totals.inputTokens} çıkış ${cp.totals.outputTokens} token, $${cp.totals.usd.toFixed(2)}`
        )
      })
      .catch((e) => {
        console.error(e instanceof Error ? e.message : e)
        process.exitCode = 1
      })
    return 0
  }

  if (cmd === 'brief') {
    const plan = loadPlan(l)
    const cp0 = loadCheckpoint(l, c.sha256)
    let units = plan.units.filter((u) => cp0.units[u.hash]?.status !== 'done')
    if (values.chapter !== undefined) units = units.filter((u) => u.chapter === Number(values.chapter))
    if (values.limit !== undefined) units = units.slice(0, Number(values.limit))
    const files = writeBriefs(l, c, plan, units)
    console.log(`${files.length} brief → ${path.relative(l.root, briefDir(l))}`)
    for (const f of files) console.log('  ' + path.relative(l.root, f))
    return 0
  }

  if (cmd === 'ingest') {
    const plan = loadPlan(l)
    const rows = ingest(l, c, plan)
    for (const r of rows) console.log(`  ${r.unitId}: ${r.error ? 'HATA ' + r.error : `${r.questions} soru, ${r.dropped} düşen`}`)
    console.log(`${rows.length} birim işlendi`)
    return rows.some((r) => r.error) ? 1 : 0
  }

  if (cmd === 'verify') {
    const r = verify(l, c)
    console.log(
      `${r.units} birim, ${r.questions} soru, ${r.dropped} düşen, ${r.errors.length} hata, ${r.warnings.length} uyarı, harfler ${JSON.stringify(r.letters)} → build/verify-report.json`
    )
    for (const e of r.errors.slice(0, 20)) console.log(`  HATA ${e.id} ${e.code}: ${e.message}`)
    return r.ok ? 0 : 1
  }

  if (cmd === 'pack') {
    console.log('yazıldı: ' + path.relative(l.root, pack(l, c)))
    return 0
  }

  throw new Error('bilinmeyen komut: ' + cmd + '\n' + HELP)
}

try {
  process.exitCode = main(process.argv.slice(2))
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exitCode = 1
}
