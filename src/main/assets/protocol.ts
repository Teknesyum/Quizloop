import { net, protocol } from 'electron'
import { existsSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export const SCHEME = 'quizloop'

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

const ALLOWED = /\.(webp|png|svg|jpg|jpeg)$/i

export function registerAssetProtocol(
  rootOf: (moduleId: string) => string | undefined,
  pdfOf: (moduleId: string) => string | null = () => null
): void {
  protocol.handle(SCHEME, (req) => {
    const url = new URL(req.url)
    if (url.hostname === 'kaynak') {
      const [, moduleId] = url.pathname.split('/')
      if (!moduleId) return new Response(null, { status: 404 })
      const target = pdfOf(decodeURIComponent(moduleId))
      if (!target) return new Response(null, { status: 404 })
      if (!/\.pdf$/i.test(target)) return new Response(null, { status: 403 })
      if (!existsSync(target)) return new Response(null, { status: 404 })
      return net.fetch(pathToFileURL(target).toString())
    }
    if (url.hostname !== 'module') return new Response(null, { status: 404 })
    const [, moduleId, ...rest] = url.pathname.split('/')
    if (!moduleId || rest[0] !== 'assets') return new Response(null, { status: 404 })
    const root = rootOf(moduleId)
    if (!root) return new Response(null, { status: 404 })
    const target = resolve(join(root, ...rest.map(decodeURIComponent)))
    const base = resolve(root) + sep
    if (!target.startsWith(base) || !ALLOWED.test(target))
      return new Response(null, { status: 403 })
    if (!existsSync(target)) return new Response(null, { status: 404 })
    return net.fetch(pathToFileURL(target).toString())
  })
}

export function assetBase(moduleId: string): string {
  return `${SCHEME}://module/${moduleId}/`
}
