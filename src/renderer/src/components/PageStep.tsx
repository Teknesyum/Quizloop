import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { SourceBook } from '@shared/ipc'
import type { SolutionBlock } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { Leaf } from './BookViewer'
import { Figure } from './Figure'
import { Skeleton } from './Skeleton'
import { ZoomBox } from './ZoomBox'
import { bookTarget, openBook } from './bookdoc'

type PageBlock = Extract<SolutionBlock, { type: 'sayfa' }>

export function PageStep({
  b,
  book,
  assetBase
}: {
  b: PageBlock
  book: SourceBook | null
  assetBase: string
}): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [ratio, setRatio] = useState(Math.SQRT2)
  const [failed, setFailed] = useState(false)
  const [focus, setFocus] = useState<HTMLElement | null>(null)
  const [sharp, setSharp] = useState(1)
  const onMarks = useCallback((sheet: HTMLElement) => setFocus(sheet), [])
  const target = bookTarget(book, b.pdfSayfa)
  const url = target?.url ?? null
  const path = target?.path ?? null
  const whole = target?.whole ?? false
  const local = b.pdfSayfa - (target?.base ?? 0)
  const folio = b.pdfSayfa - (book?.sayfaOfseti ?? 0)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const fit = (): void => setWidth(Math.floor(el.clientWidth))
    fit()
    const seen = new ResizeObserver(fit)
    seen.observe(el)
    return () => seen.disconnect()
  }, [url])

  useEffect(() => {
    if (!url) return
    let dead = false
    const entry = openBook(url, path, whole)
    entry.promise.then(
      (d) => {
        if (dead) return
        setDoc(d)
        if (entry.ratio) setRatio(entry.ratio)
      },
      () => {
        if (!dead) setFailed(true)
      }
    )
    return () => {
      dead = true
    }
  }, [url, path, whole])

  const highlight = useMemo(
    () =>
      b.isaretler?.length
        ? { marks: b.isaretler.map((m) => ({ page: local, bbox: m.bbox })) }
        : b.alinti
          ? { quote: b.alinti }
          : null,
    [b, local]
  )

  if (!url || failed) {
    if (b.ref) return <Figure src={assetBase + b.ref} alt={t('book.pageOf', { page: folio })} />
    return (
      <p className="tk-hint ql-tell-nopage">
        {t('book.pageMissing', { page: folio })}
        {b.alinti ? ` “${b.alinti}”` : ''}
      </p>
    )
  }

  return (
    <figure className="ql-tell-page ql-transition-in">
      <div ref={hostRef} className="ql-tell-sheet">
        {doc && width > 0 ? (
          <ZoomBox target={focus} label={t('book.pageOf', { page: folio })} onSharp={setSharp}>
            <Leaf
              doc={doc}
              pdfPage={local}
              folio={folio}
              width={width}
              renderWidth={Math.round(width * sharp)}
              ratio={ratio}
              highlight={highlight}
              shown
              follow={false}
              onMarks={onMarks}
            />
          </ZoomBox>
        ) : (
          <Skeleton lines={6} />
        )}
      </div>
    </figure>
  )
}
