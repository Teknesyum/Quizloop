import { readMeta } from '@core/modules/loader'
import type { CorePorts } from '@core/ports'
import type { BookPartLink, SourceBook } from '@shared/ipc'
import type { Library } from './library'

export interface BookResolver {
  path(moduleId: string, root: string, file?: string): string | null
  url(moduleId: string): string
  file?(root: string, rel: string, moduleId: string): string
}

interface Src {
  file?: string
  pages?: number
  sayfaOfseti: number
  sagdanSola?: boolean
  bolumler?: { bolum: number; ilkSayfa: number; sonSayfa: number; dosya: string }[]
}

export async function sourceBook(
  deps: { ports: CorePorts; library: Library; books: BookResolver },
  moduleId: string
): Promise<SourceBook> {
  const root = deps.library.rootOf(moduleId)
  if (!root) return { available: false, url: null, path: null, sayfaOfseti: 0, pages: null }
  let src: Src | undefined
  try {
    src = (await readMeta(deps.ports, root)).meta.source
  } catch {
    src = undefined
  }
  const path = deps.books.path(moduleId, root, src?.file)
  const url = path ? deps.books.url(moduleId) : null
  const fileUrl = deps.books.file
  const parts: BookPartLink[] | null =
    !path && fileUrl && src?.bolumler?.length
      ? src.bolumler.map((b) => ({
          bolum: b.bolum,
          ilkSayfa: b.ilkSayfa,
          sonSayfa: b.sonSayfa,
          url: fileUrl(root, b.dosya, moduleId)
        }))
      : null
  return {
    available: Boolean(url) || Boolean(parts?.length),
    url,
    path,
    sayfaOfseti: src?.sayfaOfseti ?? 0,
    pages: src?.pages ?? null,
    parts,
    sagdanSola: src?.sagdanSola === true
  }
}
