import { readMeta } from '@core/modules/loader'
import type { CorePorts } from '@core/ports'
import type { SourceBook } from '@shared/ipc'
import type { Library } from './library'

export interface BookResolver {
  path(moduleId: string, root: string, file?: string): string | null
  url(moduleId: string): string
}

export async function sourceBook(
  deps: { ports: CorePorts; library: Library; books: BookResolver },
  moduleId: string
): Promise<SourceBook> {
  const root = deps.library.rootOf(moduleId)
  if (!root) return { available: false, url: null, path: null, sayfaOfseti: 0, pages: null }
  let src: { file?: string; pages?: number; sayfaOfseti: number } | undefined
  try {
    src = (await readMeta(deps.ports, root)).meta.source
  } catch {
    src = undefined
  }
  const path = deps.books.path(moduleId, root, src?.file)
  return {
    available: Boolean(path),
    url: path ? deps.books.url(moduleId) : null,
    path,
    sayfaOfseti: src?.sayfaOfseti ?? 0,
    pages: src?.pages ?? null
  }
}
