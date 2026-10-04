import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PageFlip } from 'page-flip'
import 'page-flip/src/Style/stPageFlip.css'
import { Util, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import { tinykeys } from 'tinykeys'
import type { SourceBook } from '@shared/ipc'
import type { Source } from '@shared/schema/question'
import { findQuoteRuns, pdfPageOf } from '@shared/kaynak'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { shortAlt } from './media'
import { useApp } from '@renderer/store/app'
import { bookTarget, idle, openBook, sourcePdfPage, warmBook } from './bookdoc'
import './bookviewer.css'

const MAX_PX = 1 << 25
const ZOOM_MAX = 4
const DPR_MAX = 2

interface Highlight {
  bbox?: [number, number, number, number]
  bboxPage?: number
  quote?: string
  marks?: { page: number; bbox: [number, number, number, number] }[]
}

interface Job {
  key: string
  want: boolean
  task: RenderTask | null
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

function tokenMs(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? (raw.endsWith('ms') ? n : n * 1000) : 1
}

function slowMs(): number {
  return tokenMs('--tk-t-slow')
}

function release(host: HTMLElement | null): void {
  host?.querySelectorAll('canvas').forEach((c) => {
    c.width = 0
    c.height = 0
  })
}

function pinchSpan(t: TouchList): { d: number; x: number; y: number } | null {
  const a = t[0]
  const b = t[1]
  if (!a || !b) return null
  return {
    d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2
  }
}

interface FlipInner {
  isUserTouch: boolean
  isUserMove: boolean
  getUI(): {
    touchPoint: unknown
    getDistElement(): HTMLElement
    getMousePos(x: number, y: number): { x: number; y: number }
  }
  getFlipController(): { stopMove(): void }
}

function dropTouch(pf: PageFlip | null): void {
  if (!pf) return
  const app = pf as unknown as FlipInner
  app.getUI().touchPoint = null
  if (app.isUserTouch && app.isUserMove) app.getFlipController().stopMove()
  app.isUserTouch = false
  app.isUserMove = false
}

function mirrorPointer(pf: PageFlip): void {
  const ui = (pf as unknown as FlipInner).getUI()
  ui.getMousePos = (x, y) => {
    const r = ui.getDistElement().getBoundingClientRect()
    return { x: r.right - x, y: y - r.top }
  }
}

function Leaf({
  doc,
  pdfPage,
  folio,
  width,
  renderWidth,
  ratio,
  highlight,
  shown,
  follow
}: {
  doc: PDFDocumentProxy | null
  pdfPage: number
  folio: number
  width: number
  renderWidth: number
  ratio: number
  highlight: Highlight | null
  shown: boolean
  follow: boolean
}): React.JSX.Element {
  const paintRef = useRef<HTMLDivElement | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const doneRef = useRef('')
  const jobRef = useRef<Job | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [unit, setUnit] = useState<{ w: number; h: number } | null>(null)
  const blank = !doc || pdfPage < 1 || pdfPage > doc.numPages

  useEffect(() => {
    const paint = paintRef.current
    return () => release(paint)
  }, [])

  useEffect(() => {
    if (!follow || !shown || rects.length === 0) return
    sheetRef.current
      ?.querySelector('.ql-book-mark')
      ?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' })
  }, [rects, shown, follow])

  useEffect(() => {
    let dead = false
    if (!doc || blank) return
    const run = async (): Promise<void> => {
      const page = await doc.getPage(pdfPage)
      if (dead) return
      const viewport = page.getViewport({ scale: 1 })
      setUnit({ w: viewport.width, h: viewport.height })
      setRects([])
      if (!highlight) return
      const bboxHere = highlight.bbox && highlight.bboxPage === pdfPage ? highlight.bbox : null
      if (bboxHere) {
        const [x0, y0, x1, y1] = bboxHere
        setRects([{ left: x0, top: y0, width: x1 - x0, height: y1 - y0, outline: true }])
        return
      }
      if (highlight.marks) {
        setRects(
          highlight.marks
            .filter((m) => m.page === pdfPage)
            .map(({ bbox: [x0, y0, x1, y1] }) => ({
              left: x0,
              top: y0,
              width: x1 - x0,
              height: y1 - y0,
              outline: true
            }))
        )
        return
      }
      if (!highlight.quote) return
      const text = await page.getTextContent()
      if (dead) return
      const items = text.items.flatMap((i) =>
        'str' in i
          ? [{ str: i.str, transform: i.transform as number[], width: i.width, height: i.height }]
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
              width: Math.max(item.width, 1),
              height: Math.max(item.height, 1) * 0.18,
              outline: false
            }
          ]
        })
      )
    }
    run().catch(() => setRects([]))
    return () => {
      dead = true
    }
  }, [doc, blank, pdfPage, highlight])

  useEffect(() => {
    if (!doc || blank || renderWidth <= 0) return
    const dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1)
    const key = `${pdfPage}:${renderWidth}:${dpr}`
    if (doneRef.current === key) return
    const live = jobRef.current
    if (live && live.key === key) {
      live.want = true
      return () => {
        live.want = false
        setTimeout(() => {
          if (!live.want) live.task?.cancel()
        }, 0)
      }
    }
    live?.task?.cancel()
    const job: Job = { key, want: true, task: null }
    jobRef.current = job
    const run = async (): Promise<void> => {
      if (!shown) await idle()
      if (!job.want) return
      const page = await doc.getPage(pdfPage)
      if (!job.want) return
      const unitVp = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: renderWidth / unitVp.width })
      const px = Math.min(dpr, Math.sqrt(MAX_PX / (viewport.width * viewport.height)))
      const canvas = document.createElement('canvas')
      canvas.className = 'ql-bv-canvas'
      canvas.width = Math.max(1, Math.round(viewport.width * px))
      canvas.height = Math.max(1, Math.round(viewport.height * px))
      job.task = page.render({
        canvas,
        viewport,
        transform: [canvas.width / viewport.width, 0, 0, canvas.height / viewport.height, 0, 0]
      })
      await job.task.promise
      if (!job.want || !paintRef.current) return
      release(paintRef.current)
      paintRef.current.replaceChildren(canvas)
      doneRef.current = key
    }
    run()
      .catch(() => undefined)
      .finally(() => {
        if (jobRef.current === job) jobRef.current = null
      })
    return () => {
      job.want = false
      setTimeout(() => {
        if (!job.want) job.task?.cancel()
      }, 0)
    }
  }, [doc, blank, pdfPage, renderWidth, shown])

  const k = unit ? width / unit.w : 0
  const h = unit ? (width * unit.h) / unit.w : width * ratio

  return (
    <div className="ql-book-leaf" aria-hidden={blank || !shown}>
      <div
        ref={sheetRef}
        className="ql-book-sheet"
        style={blank ? undefined : { width, height: h }}
      >
        <div ref={paintRef} className="ql-bv-paint" />
        {k > 0 &&
          rects.map((r, i) => (
            <span
              key={i}
              className={`ql-book-mark ${r.outline ? 'ql-book-outline' : 'ql-book-underline'}`}
              style={{ left: r.left * k, top: r.top * k, width: r.width * k, height: r.height * k }}
            />
          ))}
      </div>
      {!blank && <span className="tk-mono ql-book-folio">{folio}</span>}
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
  const offset = book?.sayfaOfseti ?? 0
  const rtl = book?.sagdanSola === true
  const target = useMemo(
    () => bookTarget(book, sourcePdfPage(source, offset)),
    [book, source, offset]
  )
  const usePdf = Boolean(target)
  const base = target?.base ?? 0
  const lo = Math.max(1, base + 1 - offset)
  const shift = lo - (lo % 2)
  const warm = target ? warmBook(target.url, target.path) : null
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(() => warm?.doc ?? null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cur, setCur] = useState(() => Math.max(lo, sourcePdfPage(source, offset) - offset))
  const [portrait, setPortrait] = useState(false)
  const [pageEls, setPageEls] = useState<HTMLElement[]>([])
  const hostRef = useRef<HTMLDivElement | null>(null)
  const flipRef = useRef<PageFlip | null>(null)
  const curRef = useRef(cur)
  const [leafWidth, setLeafWidth] = useState(0)
  const [ratio, setRatio] = useState(() => warm?.ratio ?? 1.4)
  const blinkSeconds = useApp((s) => s.settings?.blinkSeconds ?? 5)
  const [single, setSingle] = useState(false)
  const spreadRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const paneRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [sharpZoom, setSharpZoom] = useState(1)
  const zoomRef = useRef(1)
  const anchorRef = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null)

  const targetUrl = target?.url ?? null
  const targetPath = target?.path ?? null
  const targetWhole = target?.whole ?? false

  useEffect(() => {
    if (!targetUrl) return
    let dead = false
    const entry = openBook(targetUrl, targetPath, targetWhole)
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
  }, [targetUrl, targetPath, targetWhole])

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

  const last = doc ? doc.numPages + base : (book?.pages ?? source.pages[1])
  const maxLeft = Math.max(lo, last - offset)
  const leafH = Math.round(leafWidth * ratio)
  const left = portrait ? cur : cur - (cur % 2)

  useEffect(() => {
    curRef.current = cur
  }, [cur])

  useEffect(() => {
    const host = hostRef.current
    if (!doc || !host || leafWidth <= 0 || leafH <= 0) return
    const root = document.createElement('div')
    host.appendChild(root)
    const els = Array.from({ length: maxLeft - shift + 1 }, () => {
      const el = document.createElement('div')
      el.className = 'ql-book-page'
      return el
    })
    root.append(...els)
    const pf = new PageFlip(root, {
      width: leafWidth,
      height: leafH,
      size: 'fixed',
      startPage: Math.min(curRef.current, maxLeft) - shift,
      showCover: false,
      usePortrait: true,
      autoSize: true,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      flippingTime: slowMs() * 2.2,
      mobileScrollSupport: false,
      showPageCorners: true
    })
    pf.loadFromHTML(els)
    if (rtl) mirrorPointer(pf)
    pf.on('flip', (e) => setCur(Number(e.data) + shift))
    pf.on('changeOrientation', (e) => setPortrait(e.data === 'portrait'))
    flipRef.current = pf
    setPageEls(els)
    setCur(pf.getCurrentPageIndex() + shift)
    setPortrait(pf.getOrientation() === 'portrait')
    return () => {
      flipRef.current = null
      setPageEls([])
      pf.destroy()
      root.remove()
    }
  }, [doc, leafWidth, leafH, maxLeft, shift, rtl])

  useEffect(() => {
    if (zoom === sharpZoom) return
    const h = window.setTimeout(() => setSharpZoom(zoom), slowMs())
    return () => window.clearTimeout(h)
  }, [zoom, sharpZoom])

  const zoomTo = useCallback((next: number, cx?: number, cy?: number) => {
    const z = zoomRef.current
    const clamped = Math.min(ZOOM_MAX, Math.max(1, next))
    const target = clamped < 1.04 ? 1 : clamped
    if (target === z) return
    const base = z > 1 ? trackRef.current : hostRef.current
    const frame = frameRef.current?.getBoundingClientRect()
    const x = cx ?? (frame ? frame.left + frame.width / 2 : 0)
    const y = cy ?? (frame ? frame.top + frame.height / 2 : 0)
    const r = base?.getBoundingClientRect()
    anchorRef.current = r ? { px: (x - r.left) / z, py: (y - r.top) / z, cx: x, cy: y } : null
    zoomRef.current = target
    setZoom(target)
    if (target === 1) setSharpZoom(1)
  }, [])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const d =
        e.deltaMode === 1
          ? e.deltaY * 16
          : e.deltaMode === 2
            ? e.deltaY * el.clientHeight
            : e.deltaY
      const gain = Math.abs(d) < 50 ? 0.01 : 0.0025
      zoomTo(zoomRef.current * Math.exp(-d * gain), e.clientX, e.clientY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomTo])

  useEffect(() => {
    const el = frameRef.current
    if (!el || !window.quizloop.capabilities.pinchZoom) return
    let start: { d: number; z: number; x: number; y: number } | null = null
    const onStart = (e: TouchEvent): void => {
      const s = e.touches.length === 2 ? pinchSpan(e.touches) : null
      if (!s || s.d <= 0) return
      e.preventDefault()
      e.stopPropagation()
      dropTouch(flipRef.current)
      start = { d: s.d, z: zoomRef.current, x: s.x, y: s.y }
    }
    const onMove = (e: TouchEvent): void => {
      if (!start) return
      const s = pinchSpan(e.touches)
      if (!s) return
      e.preventDefault()
      e.stopPropagation()
      const pane = paneRef.current
      if (pane && zoomRef.current > 1) {
        pane.scrollLeft -= s.x - start.x
        pane.scrollTop -= s.y - start.y
      }
      start.x = s.x
      start.y = s.y
      zoomTo((start.z * s.d) / start.d, s.x, s.y)
    }
    const onEnd = (e: TouchEvent): void => {
      if (start && e.touches.length < 2) start = null
    }
    el.addEventListener('touchstart', onStart, { passive: false, capture: true })
    el.addEventListener('touchmove', onMove, { passive: false, capture: true })
    el.addEventListener('touchend', onEnd, { capture: true })
    el.addEventListener('touchcancel', onEnd, { capture: true })
    return () => {
      el.removeEventListener('touchstart', onStart, { capture: true })
      el.removeEventListener('touchmove', onMove, { capture: true })
      el.removeEventListener('touchend', onEnd, { capture: true })
      el.removeEventListener('touchcancel', onEnd, { capture: true })
    }
  }, [zoomTo])

  useLayoutEffect(() => {
    const a = anchorRef.current
    anchorRef.current = null
    const pane = paneRef.current
    const track = trackRef.current
    if (!a || !pane || !track || zoom <= 1) return
    const r = track.getBoundingClientRect()
    pane.scrollLeft += r.left + a.px * zoom - a.cx
    pane.scrollTop += r.top + a.py * zoom - a.cy
  }, [zoom])

  const step = portrait ? 1 : 2
  const turn = useCallback((dir: 'next' | 'prev') => {
    const pf = flipRef.current
    if (!pf) return
    if (reduced() || document.hidden || zoomRef.current > 1) {
      if (dir === 'next') pf.turnToNextPage()
      else pf.turnToPrevPage()
    } else if (dir === 'next') pf.flipNext()
    else pf.flipPrev()
  }, [])

  useEffect(() => {
    return tinykeys(window, {
      Escape: (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (zoomRef.current > 1) zoomTo(1)
        else onClose()
      },
      ArrowRight: () => turn(rtl ? 'prev' : 'next'),
      ArrowLeft: () => turn(rtl ? 'next' : 'prev'),
      Space: (e) => {
        e.preventDefault()
        turn('next')
      }
    })
  }, [turn, onClose, zoomTo, rtl])

  const highlight = useMemo<Highlight | null>(() => {
    if (source.kesit) return { bbox: source.kesit.bbox, bboxPage: source.kesit.pdfSayfa - base }
    if (source.isaretler?.length)
      return { marks: source.isaretler.map((m) => ({ page: m.pdfSayfa - base, bbox: m.bbox })) }
    return { quote: source.quote }
  }, [source, base])

  const pages = portrait ? [Math.max(lo, left)] : [Math.max(lo, left), Math.min(left + 1, maxLeft)]
  const blinkN = Math.max(1, Math.round((blinkSeconds * 1000) / slowMs()) | 1)
  const kesitRef = source.kesit?.ref
  const showPick = !usePdf || failed
  const canPick = window.quizloop.capabilities.folders
  const showForget = Boolean(book?.path) && !failed
  const zoomed = zoom > 1 && Boolean(doc) && leafWidth > 0

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
            {usePdf && !failed && (
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm tk-mono"
                onClick={() => zoomTo(1)}
                disabled={zoom === 1}
                title={t('book.zoomReset')}
              >
                {t('book.zoom', { n: Math.round(zoom * 100) })}
              </button>
            )}
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => turn('prev')}
              disabled={showPick || left <= (portrait ? lo : shift)}
            >
              {t('book.prev')}
            </button>
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => turn('next')}
              disabled={showPick || left + step > maxLeft}
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

        <div ref={frameRef} className="ql-bv-frame">
          <div ref={spreadRef} className={`ql-book-spread ${single ? 'ql-book-single' : ''}`}>
            {usePdf && !failed ? (
              doc ? (
                <div
                  ref={hostRef}
                  className={`ql-book-stage ${rtl ? 'ql-book-rtl' : ''}`}
                  style={
                    {
                      '--ql-leaf-w': `${leafWidth}px`,
                      '--ql-leaf-h': `${leafH}px`
                    } as React.CSSProperties
                  }
                >
                  {pageEls.map((el, j) => {
                    const i = j + shift
                    return i >= lo && i >= left - 2 && i <= left + 3
                      ? createPortal(
                          <Leaf
                            doc={doc}
                            pdfPage={pdfPageOf(i, offset) - base}
                            folio={pdfPageOf(i, offset)}
                            width={leafWidth}
                            renderWidth={leafWidth}
                            ratio={ratio}
                            highlight={highlight}
                            shown={portrait ? i === cur : i === left || i === left + 1}
                            follow
                          />,
                          el,
                          String(i)
                        )
                      : null
                  })}
                </div>
              ) : (
                <div className="ql-book-loading">
                  <Skeleton lines={6} />
                </div>
              )
            ) : kesitRef ? (
              <figure className="ql-book-kesit">
                <img
                  src={assetBase + kesitRef}
                  alt={t('book.kesitAlt', {
                    file: source.file,
                    page: source.kesit?.pdfSayfa ?? source.pages[0],
                    quote: shortAlt(source.quote)
                  })}
                />
                <figcaption className="tk-hint">{t('book.kesitOnly')}</figcaption>
              </figure>
            ) : (
              <div className="ql-book-missing">
                <p className="tk-prose">
                  {t(
                    window.quizloop.capabilities.packageImport
                      ? 'book.missingPhone'
                      : 'book.missing'
                  )}
                </p>
                {canPick && (
                  <button
                    type="button"
                    className="tk-btn tk-btn-primary"
                    onClick={pick}
                    disabled={busy}
                    title={busy ? t('book.busy') : t('book.pick')}
                  >
                    {t('book.pick')}
                  </button>
                )}
              </div>
            )}
          </div>
          {zoomed && (
            <div ref={paneRef} className="ql-bv-zoom">
              <div ref={trackRef} className={`ql-bv-track ${rtl ? 'ql-bv-rtl' : ''}`}>
                {pages.map((i) => (
                  <div key={i} className="ql-bv-zleaf" style={{ width: leafWidth * zoom }}>
                    <Leaf
                      doc={doc}
                      pdfPage={pdfPageOf(i, offset) - base}
                      folio={pdfPageOf(i, offset)}
                      width={leafWidth * zoom}
                      renderWidth={leafWidth * sharpZoom}
                      ratio={ratio}
                      highlight={highlight}
                      shown
                      follow={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="ql-book-foot">
          <p className="ql-book-quote">{source.quote}</p>
          {((showPick && kesitRef && canPick) || showForget) && (
            <span className="ql-book-source">
              {showPick && kesitRef && canPick && (
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
