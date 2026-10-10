interface Env {
  GITHUB_TOKEN: string
  REPO: string
}

interface Rapor {
  app?: string
  note?: string
  shot?: boolean
  image?: string | null
  ctx?: Record<string, unknown>
}

const GOVDE_MAX = 1_500_000
const NOT_MAX = 2000
const OZET_MAX = 70
const ALAN_MAX = 300
const BILINMEYEN = 'Bilinmeyen'
const ALANLAR = [
  'version',
  'platform',
  'route',
  'moduleId',
  'questionId',
  'lang',
  'view',
  'agent'
] as const

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400'
}

function yanit(durum: number, govde: unknown): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'content-type': 'application/json', ...CORS }
  })
}

function duz(deger: unknown, sinir: number): string {
  return String(deger ?? '')
    .replace(/[`\r\n|<>@#[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, sinir)
}

function uygulamaAdi(deger: unknown): string {
  const ad = String(deger ?? '').trim()
  return /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,39}$/.test(ad) ? ad : BILINMEYEN
}

async function github(env: Env, yol: string, yontem: string, govde: unknown): Promise<unknown> {
  const res = await fetch(`https://api.github.com/repos/${env.REPO}${yol}`, {
    method: yontem,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'privateissues',
      'content-type': 'application/json'
    },
    body: JSON.stringify(govde)
  })
  if (!res.ok) throw new Error(`github ${res.status}`)
  return res.json()
}

async function bildir(env: Env, rapor: Rapor): Promise<Response> {
  const ctx = rapor.ctx ?? {}
  const uygulama = uygulamaAdi(rapor.app)
  const alan = Object.fromEntries(ALANLAR.map((a) => [a, duz(ctx[a], ALAN_MAX)])) as Record<
    (typeof ALANLAR)[number],
    string
  >
  const not = String(rapor.note ?? '')
    .replace(/`/g, "'")
    .trim()
    .slice(0, NOT_MAX)
  let gorsel = ''
  const veri = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(rapor.image ?? '')
  if (veri) {
    const gun = new Date().toISOString().slice(0, 10)
    const klasor = uygulama.replace(/[^A-Za-z0-9]+/g, '-')
    const yol = `g/${klasor}/${gun.slice(0, 7)}/${gun}-${crypto.randomUUID()}.jpg`
    await github(env, `/contents/${yol}`, 'PUT', { message: `Görüntü ${gun}`, content: veri[1] })
    gorsel = `![Ekran](https://github.com/${env.REPO}/blob/main/${yol}?raw=true)`
  }
  const ozet =
    duz(not, OZET_MAX) || [alan.route, alan.questionId].filter(Boolean).join(' · ') || 'Bildirim'
  const satirlar = ALANLAR.filter((a) => alan[a]).map((a) => `| ${a} | ${alan[a]} |`)
  const issue = (await github(env, '/issues', 'POST', {
    title: `${uygulama}: ${ozet}`,
    body: [
      '| Alan | Değer |',
      '| --- | --- |',
      `| app | ${uygulama} |`,
      ...satirlar,
      '',
      ...(not ? ['```', not, '```', ''] : []),
      gorsel || (rapor.shot === false ? 'Kullanıcı görüntüyü kapattı.' : 'Görüntü alınamadı.')
    ].join('\n')
  })) as { number: number }
  return yanit(200, { no: issue.number })
}

export default {
  async fetch(istek: Request, env: Env): Promise<Response> {
    if (istek.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    if (istek.method !== 'POST') return yanit(405, { hata: 'yontem' })
    const ham = await istek.text()
    if (ham.length > GOVDE_MAX) return yanit(413, { hata: 'boyut' })
    let govde: unknown
    try {
      govde = JSON.parse(ham)
    } catch {
      return yanit(400, { hata: 'json' })
    }
    if (typeof govde !== 'object' || govde === null) return yanit(400, { hata: 'json' })
    if (new URL(istek.url).pathname !== '/bildir') return yanit(404, { hata: 'yol' })
    try {
      return await bildir(env, govde as Rapor)
    } catch {
      return yanit(502, { hata: 'github' })
    }
  }
}
