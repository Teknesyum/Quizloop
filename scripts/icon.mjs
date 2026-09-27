import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const outArg = process.argv.indexOf('--out')
const out = outArg > 0 ? process.argv[outArg + 1] : null
const tokens = JSON.parse(readFileSync(join(root, 'teknesyum-ui/theme.tokens.json'), 'utf8'))
const c = (k) => tokens.brand[k].value

const browsers = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean)
const browser = browsers.find((p) => existsSync(p))
if (!browser) throw new Error('Chrome or Edge not found; set CHROME')

function brain(cx, size) {
  const k = (size * 0.36) / 100
  const lobe = 'M -3 -40 A 14 14 0 0 0 -26 -34 A 14 14 0 0 0 -44 -14 A 14 14 0 0 0 -44 12 A 14 14 0 0 0 -30 36 A 14 14 0 0 0 -3 40 Z'
  const folds = size >= 48
    ? `<path d="M -32 -22 Q -18 -20 -20 -6 M -40 2 Q -26 0 -20 12 M -28 26 Q -18 22 -14 32" fill="none" stroke="${c('black')}" stroke-width="4" stroke-linecap="round"/>`
    : ''
  const half = `<path d="${lobe}" fill="${c('renk-3')}"/>${folds}`
  return `<g transform="translate(${cx} ${cx}) scale(${k})">${half}<g transform="scale(-1 1)">${half}</g></g>`
}

function svg(size) {
  const r = (tokens.shape['r-window'].value * size) / 32
  const b = Math.max(1, size / 64)
  const cx = size / 2
  const ring = size * 0.3
  const w = size * 0.1
  const rad = (d) => (d * Math.PI) / 180
  const p = (d, k = ring) => [cx + k * Math.cos(rad(d)), cx + k * Math.sin(rad(d))]
  const [x0, y0] = p(300)
  const [x1, y1] = p(205)
  const head = size * 0.12
  const e = rad(205)
  const nrm = [Math.cos(e), Math.sin(e)]
  const tip = p(205 + ((head * 1.4) / ring) * (180 / Math.PI))
  const back1 = [x1 + nrm[0] * head * 0.75, y1 + nrm[1] * head * 0.75]
  const back2 = [x1 - nrm[0] * head * 0.75, y1 - nrm[1] * head * 0.75]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c('glass-base')}"/><stop offset="1" stop-color="${c('black')}"/></linearGradient></defs>
<rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
<rect x="${b / 2}" y="${b / 2}" width="${size - b}" height="${size - b}" rx="${r}" fill="none" stroke="${c('renk-1')}" stroke-opacity="0.7" stroke-width="${b}"/>
<path d="M ${x0} ${y0} A ${ring} ${ring} 0 1 1 ${x1} ${y1}" fill="none" stroke="${c('renk-1')}" stroke-width="${w}" stroke-linecap="butt"/>
<path d="M ${tip.join(' ')} L ${back1.join(' ')} L ${back2.join(' ')} Z" fill="${c('renk-1')}"/>
${brain(cx, size)}
</svg>`
}

const work = mkdtempSync(join(tmpdir(), 'ql-icon-'))
function render(size) {
  const html = join(work, `i${size}.html`)
  const out = join(work, `i${size}.png`)
  writeFileSync(html, `<!doctype html><html><body style="margin:0;background:transparent">${svg(size)}</body></html>`)
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--window-size=${size},${size}`,
    `--screenshot=${out}`,
    'file:///' + html.replace(/\\/g, '/')
  ], { stdio: 'ignore' })
  return readFileSync(out)
}

const png = {}
for (const s of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) png[s] = render(s)

function ico(sizes) {
  const head = Buffer.alloc(6 + 16 * sizes.length)
  head.writeUInt16LE(0, 0)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(sizes.length, 4)
  let off = head.length
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i
    head.writeUInt8(s >= 256 ? 0 : s, e)
    head.writeUInt8(s >= 256 ? 0 : s, e + 1)
    head.writeUInt16LE(1, e + 4)
    head.writeUInt16LE(32, e + 6)
    head.writeUInt32LE(png[s].length, e + 8)
    head.writeUInt32LE(off, e + 12)
    off += png[s].length
  })
  return Buffer.concat([head, ...sizes.map((s) => png[s])])
}

function icns(map) {
  const parts = Object.entries(map).map(([type, s]) => {
    const h = Buffer.alloc(8)
    h.write(type, 0, 'ascii')
    h.writeUInt32BE(png[s].length + 8, 4)
    return Buffer.concat([h, png[s]])
  })
  const body = Buffer.concat(parts)
  const h = Buffer.alloc(8)
  h.write('icns', 0, 'ascii')
  h.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([h, body])
}

if (out) {
  for (const s of Object.keys(png)) writeFileSync(join(out, `icon-${s}.png`), png[s])
  writeFileSync(join(out, 'icon.ico'), ico([16, 24, 32, 48, 64, 128, 256]))
  console.log('icon preview:', out)
  process.exit(0)
}
writeFileSync(join(root, 'build/icon.png'), png[512])
writeFileSync(join(root, 'build/icon.ico'), ico([16, 24, 32, 48, 64, 128, 256]))
writeFileSync(join(root, 'build/icon.icns'), icns({ ic07: 128, ic08: 256, ic09: 512, ic10: 1024 }))
copyFileSync(join(root, 'build/icon.png'), join(root, 'resources/icon.png'))
console.log('icon: build/icon.{png,ico,icns}, resources/icon.png from', browser)
