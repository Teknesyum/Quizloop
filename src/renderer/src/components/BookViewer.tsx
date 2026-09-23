import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, Util, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { tinykeys } from 'tinykeys'
import type { SourceBook } from '@shared/ipc'
import type { Source } from '@shared/schema/question'
import { findQuoteRuns, pdfPageOf, spreadOf } from '@shared/kaynak'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

GlobalWorkerOptions.workerSrc = workerUrl

interface Highlight {
  bbox?: [number, number, number, number]
  bboxPage?: number
  quote?: string
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
  outline: boolean
}

function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function slowMs(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--tk-t-slow').trim()
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? (raw.endsWith('ms') ? n : n * 1000) : 1
}

type Role =
  | 'left'
  | 'right'
  | 'single'
  | 'hidden'
  | 'front-next'
  | 'back-next'
  | 'front-prev'
  | 'back-prev'
  | 'single-next'
  | 'single-prev'

type Flip = 'next' | 'prev' | null

function slots(left: number, single: boolean, flip: Flip): [number, Role][] {
  if (single) {
    if (flip === 'next')
      return [
        [left - 1, 'hidden'],
        [left + 1, 'single'],
        [left, 'single-next']
      ]
    if (flip === 'prev')
      return [
        [left + 1, 'hidden'],
        [left, 'single'],
        [left - 1, 'single-prev']
      ]
    return [
      [left - 1, 'hidden'],
      [left + 1, 'hidden'],
      [left, 'single']
    ]
  }
  if (flip === 'next')
    return [
      [left - 2, 'hidden'],
      [left - 1, 'hidden'],
      [left, 'left'],
      [left + 3, 'right'],
      [left + 1, 'front-next'],
      [left + 2, 'back-next']
    ]
  if (flip === 'prev')
    return [
      [left + 2, 'hidden'],
      [left + 3, 'hidden'],
      [left - 2, 'left'],
      [left + 1, 'right'],
      [left, 'front-prev'],
      [left - 1, 'back-prev']
    ]
  return [
    [left - 2, 'hidden'],
    [left - 1, 'hidden'],
    [left + 2, 'hidden'],
    [left + 3, 'hidden'],
    [left, 'left'],
    [left + 1, 'right']
  ]
}

function Leaf({
  doc,
  pdfPage,
  width,
  highlight,
  role
}: {
  doc: PDFDocumentProxy | null
  pdfPage: number
  width: number
  highlight: Highlight | null
  role: Role
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const blank = !doc || pdfPage < 1 || pdfPage > doc.numPages
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const shown = role === 'left' || role === 'right' || role === 'single'

  useEffect(() => {
    if (!shown || rects.length === 0) return
    sheetRef.current
      ?.querySelector('.ql-book-mark')
      ?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' })
  }, [rects, shown])

  useEffect(() => {
    let dead = false
    let task: { cancel(): void } | null = null
    if (!doc || blank || width <= 0) return
    const run = async (): Promise<void> => {
      const page = await doc.getPage(pdfPage)
      setRects([])
      if (dead) return
      const unit = page.getViewport({ scale: 1 })
      const scale = width / unit.width
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(viewport.width * dpr)
      canvas.height = Math.round(viewport.height * dpr)
      setBox({ w: viewport.width, h: viewport.height })
      const render = page.render({
        canvas,
        viewport,
        transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0]
      })
      task = render
      await render.promise
      if (dead || !highlight) return
      const bboxHere = highlight.bbox && highlight.bboxPage === pdfPage ? highlight.bbox : null
      if (bboxHere) {
        const [x0, y0, x1, y1] = bboxHere
        setRects([
          {
            left: x0 * scale,
            top: y0 * scale,
            width: (x1 - x0) * scale,
            height: (y1 - y0) * scale,
            outline: true
          }
        ])
        return
      }
      if (!highlight.quote) return
      const text = await page.getTextContent()
      if (dead) return
      const items = text.items.flatMap((i) =>
        'str' in i
          ? [
              {
                str: i.str,
                transform: i.transform as number[],
                width: i.width,
                height: i.height
              }
            ]
          : []
      )
      const hit = findQuoteRuns(
        items.map((i) => i.str),
        highlight.quote
      )
      if (!hit) return
      setRects(
        hit.runs.flatMap((idx) => {
          const item = items[idx]
          if (!item || !item.str.trim()) return []
          const at = Util.transform(viewport.transform, item.transform)
          return [
            {
              left: at[4] ?? 0,
              top: at[5] ?? 0,
              width: Math.max(item.width, 1) * scale,
              height: Math.max(item.height, 1) * scale * 0.18,
              outline: false
            }
          ]
        })
      )
    }
    run().catch(() => setRects([]))
    return () => {
      dead = true
      task?.cancel()
    }
  }, [doc, blank, pdfPage, width, highlight])

  return (
    <div className={`ql-book-leaf ql-book-${role}`} aria-hidden={blank || role === 'hidden'}>
      <div
        ref={sheetRef}
        className="ql-book-sheet"
        style={box ? { width: box.w, height: box.h } : undefined}
      >
        <canvas ref={canvasRef} className="ql-book-canvas" />
        {rects.map((r, i) => (
          <span
            key={i}
            className={`ql-book-mark ${r.outline ? 'ql-book-outline' : 'ql-book-underline'}`}
            style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
          />
        ))}
      </div>
      {!blank && <span className="tk-mono ql-book-folio">{pdfPage}</span>}
    </div>
  )
}

export function BookViewer({
  book,
  moduleId,
  source,
  assetBase,
  onBook,
  onClose
}: {
  book: SourceBook | null
  moduleId: string
  source: Source
  assetBase: string
  onBook(next: SourceBook): void
  onClose(): void
}): React.JSX.Element {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(() => {
    const off = book?.sayfaOfseti ?? 0
    const start = source.kesit ? source.kesit.pdfSayfa - off : source.pages[0]
    return spreadOf(Math.max(1, start))[0]
  })
  const [flip, setFlip] = useState<Flip>(null)
  const [leafWidth, setLeafWidth] = useState(0)
  const [ratio, setRatio] = useState(1.4)
  const blinkSeconds = useApp((s) => s.settings?.blinkSeconds ?? 5)
  const [single, setSingle] = useState(false)
  const spreadRef = useRef<HTMLDivElement | null>(null)
  const usePdf = Boolean(book?.available && book.url)

  useEffect(() => {
    if (!usePdf || !book?.url) return
    let dead = false
    const task = getDocument({ url: book.url })
    task.promise.then(
      (d) => {
        if (dead) return
        setDoc(d)
        d.getPage(1).then((pg) => {
          const vp = pg.getViewport({ scale: 1 })
          if (!dead && vp.width > 0) setRatio(vp.height / vp.width)
        })
      },
      () => {
        if (!dead) setFailed(true)
      }
    )
    return () => {
      dead = true
      task.destroy()
      setDoc(null)
    }
  }, [usePdf, book?.url])

  useEffect(() => {
    const el = spreadRef.current
    if (!el) return
    const measure = (): void => {
      const narrow = el.clientWidth < 720
      setSingle(narrow)
      const gutter = narrow ? 0 : 1
      setLeafWidth(Math.max(0, Math.floor((el.clientWidth - gutter) / (narrow ? 1 : 2))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [usePdf, failed])

  const step = single ? 1 : 2
  const last = doc ? doc.numPages : (book?.pages ?? source.pages[1])
  const offset = book?.sayfaOfseti ?? 0

  const maxLeft = Math.max(1, last - offset)
  const turning = useRef(false)
  const flipDir = useRef<Flip>(null)
  const timer = useRef(0)
  const commit = useCallback(() => {
    window.clearTimeout(timer.current)
    if (!turning.current) return
    setLeft((p) => {
      const d = flipDir.current === 'next' ? step : -step
      return Math.max(1, Math.min(p + d, maxLeft))
    })
    setFlip(null)
    turning.current = false
  }, [step, maxLeft])
  const turn = useCallback(
    (dir: 'next' | 'prev') => {
      if (turning.current) return
      if (dir === 'prev' && left - step < 1) return
      if (dir === 'next' && left + step > maxLeft) return
      turning.current = true
      flipDir.current = dir
      if (reduced() || !doc || document.hidden) {
        commit()
        return
      }
      setFlip(dir)
      timer.current = window.setTimeout(commit, slowMs() * 2.2 + 200)
    },
    [left, step, maxLeft, doc, commit]
  )

  const onTurnEnd = (e: React.AnimationEvent<HTMLDivElement>): void => {
    if (e.animationName.startsWith('ql-turn-leaf')) commit()
  }

  useEffect(() => {
    return tinykeys(window, {
      Escape: (e) => {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      },
      ArrowRight: () => turn('next'),
      ArrowLeft: () => turn('prev'),
      Space: (e) => {
        e.preventDefault()
        turn('next')
      }
    })
  }, [turn, onClose])

  const highlight = useMemo<Highlight | null>(() => {
    if (source.kesit) return { bbox: source.kesit.bbox, bboxPage: source.kesit.pdfSayfa }
    return { quote: source.quote }
  }, [source])

  const pages = single ? [left] : [left, left + 1]
  const leafH = Math.round(leafWidth * ratio)
  const blinkN = Math.max(1, Math.round((blinkSeconds * 1000) / slowMs()) | 1)
  const kesitRef = source.kesit?.ref
  const showPick = !usePdf || failed
  const showForget = Boolean(book?.path) && !failed

  const pick = async (): Promise<void> => {
    setBusy(true)
    try {
      onBook(await window.quizloop.source.pickBook(moduleId))
    } finally {
      setBusy(false)
    }
  }

  const forget = async (): Promise<void> => {
    setBusy(true)
    try {
      onBook(await window.quizloop.source.forgetBook(moduleId))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tk-modal-scrim ql-book-scrim" data-tk-modal="confirm" role="presentation">
      <div
        className={`tk-panel ql-book ql-transition-in ${blinkSeconds === 0 ? 'ql-book-still' : ''}`}
        style={{ '--ql-blink-n': blinkN } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={t('book.title')}
      >
        <header className="ql-book-bar">
          <div className="ql-book-meta">
            <span className="tk-label">{t('book.title')}</span>
            <span className="tk-mono">
              {t('book.spread', { from: pages[0] ?? left, to: pages[pages.length - 1] ?? left })}
            </span>
          </div>
          <div className="ql-book-meta">
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => turn('prev')}
              disabled={left <= 1}
            >
              {t('book.prev')}
            </button>
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => turn('next')}
              disabled={left + step > maxLeft}
            >
              {t('book.next')}
            </button>
            <button
              type="button"
              className="tk-btn tk-btn-primary ql-btn-sm"
              onClick={onClose}
              autoFocus
            >
              {t('book.close')}
            </button>
          </div>
        </header>

        <div ref={spreadRef} className={`ql-book-spread ${single ? 'ql-book-single' : ''}`}>
          {usePdf && !failed ? (
            doc ? (
              <div
                className={`ql-book-stage ${flip ? `ql-book-turning-${flip}` : ''}`}
                style={
                  {
                    '--ql-leaf-w': `${leafWidth}px`,
                    '--ql-leaf-h': `${leafH}px`
                  } as React.CSSProperties
                }
                onAnimationEnd={onTurnEnd}
              >
                {slots(left, single, flip).map(([p, role]) => (
                  <Leaf
                    key={p}
                    doc={doc}
                    pdfPage={pdfPageOf(p, offset)}
                    width={leafWidth}
                    highlight={highlight}
                    role={role}
                  />
                ))}
              </div>
            ) : (
              <div className="ql-book-loading">
                <Skeleton lines={6} />
              </div>
            )
          ) : kesitRef ? (
            <figure className="ql-book-kesit">
              <img src={assetBase + kesitRef} alt={source.quote} />
              <figcaption className="tk-hint">{t('book.kesitOnly')}</figcaption>
            </figure>
          ) : (
            <p className="tk-prose ql-book-loading">{t('book.missing')}</p>
          )}
        </div>

        <footer className="ql-book-foot">
          <p className="ql-book-quote">{source.quote}</p>
          {(showPick || showForget) && (
            <span className="ql-book-source">
              {showPick && (
                <button
                  type="button"
                  className="tk-btn tk-btn-ghost ql-btn-sm"
                  onClick={pick}
                  disabled={busy}
                  title={busy ? t('book.busy') : t('book.pick')}
                >
                  {t('book.pick')}
                </button>
              )}
              {showForget && (
                <button
                  type="button"
                  className="ql-source-page"
                  onClick={forget}
                  disabled={busy}
                  title={busy ? t('book.busy') : t('book.forget')}
                >
                  {t('book.forget')}
                </button>
              )}
            </span>
          )}
          <span className="tk-hint">{t('book.keys')}</span>
        </footer>
      </div>
    </div>
  )
}
