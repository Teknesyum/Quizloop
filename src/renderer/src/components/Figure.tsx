import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ChoiceKey } from '@shared/schema/question'
import { pushBack } from '@renderer/back'
import { t } from '@renderer/i18n'
import {
  boxVars,
  clampPan,
  maskText,
  nextZoom,
  plainText,
  tagSide,
  type MarkBox,
  type MaskBox
} from './media'

interface Layer {
  masks?: MaskBox[]
  marks?: MarkBox[]
  onMark?(key: ChoiceKey): void
}

function Overlay({ masks, marks, onMark, live }: Layer & { live: boolean }): React.JSX.Element {
  return (
    <>
      {masks?.map((m, i) => (
        <span
          key={`m${i}`}
          className="ql-mask"
          style={boxVars(m.box) as React.CSSProperties}
          role="img"
          aria-label={t('media.masked', { label: maskText(m.label) })}
        >
          <span aria-hidden="true">{maskText(m.label)}</span>
        </span>
      ))}
      {marks?.map((m, i) => {
        const text = plainText(m.md)
        const cls = `ql-mark ql-mark-${m.state} ${m.open ? 'ql-mark-open' : ''}`
        const label = m.open
          ? `${m.key}: ${text}`
          : m.state === 'wrong'
            ? `${t('session.markBox', { key: m.key })}, ${t('session.wrong')}`
            : t('session.markBox', { key: m.key })
        const inner = (
          <>
            {!m.open && (
              <span className="tk-mono ql-mark-key" aria-hidden="true">
                {m.state === 'wrong' ? `✕ ${m.key}` : m.key}
              </span>
            )}
            {m.open && (
              <span className={`ql-mark-tag ql-mark-tag-${tagSide(m.box)}`} aria-hidden="true">
                <span className="tk-mono ql-mark-tag-key">{m.key}</span>
              </span>
            )}
          </>
        )
        const style = { ...boxVars(m.box), '--ql-i': i } as React.CSSProperties
        if (live && onMark) {
          return (
            <button
              key={m.key}
              type="button"
              className={cls}
              style={style}
              disabled={m.disabled}
              aria-label={label}
              title={label}
              onClick={() => onMark(m.key)}
            >
              {inner}
            </button>
          )
        }
        return (
          <span key={m.key} className={cls} style={style} role="img" aria-label={label}>
            {inner}
          </span>
        )
      })}
    </>
  )
}

const FOCUSABLE = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function Lightbox({
  src,
  alt,
  masks,
  marks,
  back,
  onClose
}: Layer & {
  src: string
  alt: string
  back: React.RefObject<HTMLElement | null>
  onClose(): void
}): React.JSX.Element {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(false)
  const [ratio, setRatio] = useState(1)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const grab = useRef<{ id: number; x: number; y: number; px: number; py: number } | null>(null)

  const size = useCallback(() => {
    const s = stageRef.current
    return { width: s?.offsetWidth ?? 0, height: s?.offsetHeight ?? 0 }
  }, [])

  const zoom = useCallback(
    (dir: 1 | -1 | 0) => {
      const n = dir === 0 ? 1 : nextZoom(scale, dir)
      setScale(n)
      setPan((p) => clampPan(p, n, size()))
    },
    [scale, size]
  )

  const nudge = useCallback(
    (dx: number, dy: number) => {
      const z = size()
      setPan((p) => clampPan({ x: p.x + dx * z.width, y: p.y + dy * z.height }, scale, z))
    },
    [scale, size]
  )

  useEffect(() => {
    const target = back.current
    closeRef.current?.focus()
    return () => target?.focus()
  }, [back])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      e.stopPropagation()
      const panel = panelRef.current
      if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.code === 'Tab' && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const at = document.activeElement
        if (e.shiftKey && (at === first || !panel.contains(at))) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && (at === last || !panel.contains(at))) {
          e.preventDefault()
          first?.focus()
        }
      } else if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault()
        zoom(1)
      } else if (e.key === '-' || e.code === 'NumpadSubtract') {
        e.preventDefault()
        zoom(-1)
      } else if (e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault()
        zoom(0)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        nudge(0.1, 0)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        nudge(-0.1, 0)
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        nudge(0, 0.1)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        nudge(0, -0.1)
      }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [onClose, zoom, nudge])

  useEffect(() => {
    const v = viewRef.current
    if (!v) return
    const h = (e: WheelEvent): void => {
      e.preventDefault()
      if (e.deltaY !== 0) zoom(e.deltaY < 0 ? 1 : -1)
    }
    v.addEventListener('wheel', h, { passive: false })
    return () => v.removeEventListener('wheel', h)
  }, [zoom])

  useEffect(
    () =>
      pushBack(() => {
        onClose()
        return true
      }),
    [onClose]
  )

  const down = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (scale === 1 || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    grab.current = { id: e.pointerId, x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    setDrag(true)
  }
  const move = (e: React.PointerEvent<HTMLDivElement>): void => {
    const g = grab.current
    if (!g || g.id !== e.pointerId) return
    setPan(clampPan({ x: g.px + e.clientX - g.x, y: g.py + e.clientY - g.y }, scale, size()))
  }
  const up = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (grab.current?.id !== e.pointerId) return
    grab.current = null
    setDrag(false)
  }

  return createPortal(
    <div className="tk-modal-scrim ql-zoom-scrim" data-tk-modal="confirm" role="presentation">
      <div
        ref={panelRef}
        className="tk-panel ql-zoom ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-label={t('media.dialog')}
      >
        <header className="ql-zoom-bar">
          <p className="tk-hint ql-zoom-hint">{t('media.keys')}</p>
          <div className="ql-zoom-tools">
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => zoom(-1)}
              disabled={scale <= 1}
              aria-label={t('media.zoomOut')}
            >
              −
            </button>
            <span className="tk-mono ql-zoom-level" aria-live="polite">
              {t('media.level', { pct: Math.round(scale * 100) })}
            </span>
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => zoom(1)}
              aria-label={t('media.zoomIn')}
            >
              +
            </button>
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => zoom(0)}
              disabled={scale === 1}
            >
              {t('media.fit')}
            </button>
            <button ref={closeRef} type="button" className="tk-btn ql-btn-sm" onClick={onClose}>
              {t('media.close')}
            </button>
          </div>
        </header>
        <div
          ref={viewRef}
          className={`ql-zoom-view ${scale > 1 ? 'ql-zoom-pan' : ''} ${drag ? 'ql-zoom-drag' : ''}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <div
            ref={stageRef}
            className="ql-zoom-stage"
            style={
              {
                '--ql-zx': `${pan.x}px`,
                '--ql-zy': `${pan.y}px`,
                '--ql-zs': scale,
                '--ql-ar': ratio
              } as React.CSSProperties
            }
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(e) => {
                const i = e.currentTarget
                if (i.naturalWidth && i.naturalHeight) setRatio(i.naturalWidth / i.naturalHeight)
              }}
            />
            <Overlay masks={masks} marks={marks} live={false} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function Figure({
  src,
  alt,
  masks,
  marks,
  onMark,
  caption,
  className
}: Layer & {
  src: string
  alt: string
  caption?: string
  className?: string
}): React.JSX.Element {
  const [zoomed, setZoomed] = useState(false)
  const openRef = useRef<HTMLButtonElement | null>(null)
  const close = useCallback(() => setZoomed(false), [])
  return (
    <figure className={`ql-media ${className ?? ''}`}>
      <div className="ql-media-frame">
        <button
          ref={openRef}
          type="button"
          className="ql-media-open"
          aria-haspopup="dialog"
          title={t('media.zoom')}
          onClick={() => setZoomed(true)}
          onKeyDown={(e) => {
            if (e.code === 'Enter' || e.code === 'Space') e.stopPropagation()
          }}
        >
          <img src={src} alt={alt} draggable={false} />
        </button>
        <Overlay masks={masks} marks={marks} onMark={onMark} live />
      </div>
      {caption && <figcaption className="tk-hint">{caption}</figcaption>}
      {zoomed && (
        <Lightbox src={src} alt={alt} masks={masks} marks={marks} back={openRef} onClose={close} />
      )}
    </figure>
  )
}
