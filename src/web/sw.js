const VERSION = '__VERSION__'
const FILES = __FILES__
const PACKS = __PACKS__
const SHELL = `ql-shell-${VERSION}`
const SCOPE = new URL(self.registration.scope).pathname
const MODULES = `${SCOPE}m/`

async function fillPack(pack) {
  const cache = await caches.open(pack.cache)
  const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname))
  const missing = pack.files.filter((f) => !have.has(new URL(f, self.registration.scope).pathname))
  await cache.addAll(missing)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([caches.open(SHELL).then((cache) => cache.addAll(FILES)), ...PACKS.map(fillPack)])
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skip') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                (k.startsWith('ql-shell-') && k !== SHELL) ||
                (k.startsWith('ql-pack-') && !PACKS.some((p) => p.cache === k))
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

const recode = (path) =>
  path
    .split('/')
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part))
      } catch {
        return part
      }
    })
    .join('/')

async function moduleFile(url) {
  const loose = { ignoreVary: true }
  const hit =
    (await caches.match(url.pathname, loose)) ?? (await caches.match(recode(url.pathname), loose))
  return hit ?? new Response('', { status: 404 })
}

async function shellFile(request) {
  const cache = await caches.open(SHELL)
  const loose = { ignoreSearch: true, ignoreVary: true }
  const hit = await cache.match(request, loose)
  if (hit) return hit
  for (const pack of PACKS) {
    const packed = await (await caches.open(pack.cache)).match(request, loose)
    if (packed) return packed
  }
  if (request.mode === 'navigate') {
    const index = await cache.match(`${SCOPE}index.html`)
    if (index) return index
  }
  return fetch(request)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return
  event.respondWith(url.pathname.startsWith(MODULES) ? moduleFile(url) : shellFile(request))
})
