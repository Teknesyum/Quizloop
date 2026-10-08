interface Env {
  GITHUB_TOKEN: string
  IMZA: string
  REPO: string
}

interface Rapor {
  image?: string | null
  ctx?: Record<string, unknown>
}

interface Not {
  no?: number
  key?: string
  note?: string
}

const GOVDE_MAX = 1_500_000
const NOT_MAX = 2000
const ALAN_MAX = 300
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
    .trim()
    .slice(0, sinir)
}

async function imza(env: Env, no: number): Promise<string> {
  const kod = new TextEncoder()
  const anahtar = await crypto.subtle.importKey(
    'raw',
    kod.encode(env.IMZA),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const ham = await crypto.subtle.sign('HMAC', anahtar, kod.encode(String(no)))
  return [...new Uint8Array(ham)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function github(env: Env, yol: string, yontem: string, govde: unknown): Promise<unknown> {
  const res = await fetch(`https://api.github.com/repos/${env.REPO}${yol}`, {
    method: yontem,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'quizloop-bildirim',
      'content-type': 'application/json'
    },
    body: JSON.stringify(govde)
  })
  if (!res.ok) throw new Error(`github ${res.status}`)
  return res.json()
}

async function bildir(env: Env, rapor: Rapor): Promise<Response> {
  const ctx = rapor.ctx ?? {}
  const alan = Object.fromEntries(ALANLAR.map((a) => [a, duz(ctx[a], ALAN_MAX)])) as Record<
    (typeof ALANLAR)[number],
    string
  >
  let gorsel = ''
  const veri = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(rapor.image ?? '')
  if (veri) {
    const gun = new Date().toISOString().slice(0, 10)
    const yol = `g/${gun.slice(0, 7)}/${gun}-${crypto.randomUUID()}.jpg`
    await github(env, `/contents/${yol}`, 'PUT', { message: `Görüntü ${gun}`, content: veri[1] })
    gorsel = `![Ekran](https://github.com/${env.REPO}/blob/main/${yol}?raw=true)`
  }
  const satirlar = ALANLAR.filter((a) => alan[a]).map((a) => `| ${a} | ${alan[a]} |`)
  const baslik = [alan.platform, alan.version, alan.route, alan.questionId]
    .filter(Boolean)
    .join(' · ')
  const issue = (await github(env, '/issues', 'POST', {
    title: baslik || 'Bildirim',
    body: [
      '| Alan | Değer |',
      '| --- | --- |',
      ...satirlar,
      '',
      gorsel || 'Görüntü alınamadı.'
    ].join('\n')
  })) as { number: number }
  return yanit(200, { no: issue.number, key: await imza(env, issue.number) })
}

async function notEkle(env: Env, girdi: Not): Promise<Response> {
  const no = Number(girdi.no)
  const metin = String(girdi.note ?? '')
    .replace(/`/g, "'")
    .trim()
    .slice(0, NOT_MAX)
  if (!Number.isInteger(no) || !metin) return yanit(400, { hata: 'girdi' })
  if (girdi.key !== (await imza(env, no))) return yanit(403, { hata: 'anahtar' })
  await github(env, `/issues/${no}/comments`, 'POST', { body: '```\n' + metin + '\n```' })
  return yanit(200, { ok: true })
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
    const yol = new URL(istek.url).pathname
    try {
      if (yol === '/bildir') return await bildir(env, govde as Rapor)
      if (yol === '/not') return await notEkle(env, govde as Not)
    } catch {
      return yanit(502, { hata: 'github' })
    }
    return yanit(404, { hata: 'yol' })
  }
}
