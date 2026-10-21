import { useCallback, useEffect, useRef, useState } from 'react'

const MAX = 4
const FOCUS = 3
const FOCUS_MIN = 1.15

interface View {
  s: number
  x: number
  y: number
}

function still(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function slow(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--tk-t-slow').trim()
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? (raw.endsWith('ms') ? n : n * 1000) : 1
}

export function ZoomBox({
  children,
  target,
  label,
  onSharp
}: {
  children: React.ReactNode
  target: HTMLElement | null
  label: string
  onSharp?(scale: number): void
}): React.JSX.Element {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 })
  const [glide, setGlide] = useState(false)
  const viewRef = useRef(view)

  const clamp = useCallback((v: View): View => {
    const box = boxRef.current
    const w = box?.clientWidth ?? 0
    const h = box?.clientHeight ?? 0
    const s = Math.min(MAX, Math.max(1, v.s))
    if (s <= 1.01) return { s: 1, x: 0, y: 0 }
    return {
      s,
      x: Math.min(0, Math.max(w - w * s, v.x)),
      y: Math.min(0, Math.max(h - h * s, v.y))
    }
  }, [])

  const apply = useCallback(
    (v: View, smooth: boolean) => {
      const next = clamp(v)
      viewRef.current = next
      setGlide(smooth && !still())
      setView(next)
    },
    [clamp]
  )

  const around = useCallback(
    (s: number, cx: number, cy: number, smooth: boolean) => {
      const box = boxRef.current
      if (!box) return
      const r = box.getBoundingClientRect()
      const v = viewRef.current
      const px = (cx - r.left - v.x) / v.s
      const py = (cy - r.top - v.y) / v.s
      apply({ s, x: cx - r.left - px * s, y: cy - r.top - py * s }, smooth)
    },
    [apply]
  )

  useEffect(() => {
    const box = boxRef.current
    if (!target || !box || viewRef.current.s !== 1) return
    const marks = [...target.querySelectorAll<HTMLElement>('.ql-book-mark')].map((m) =>
      m.getBoundingClientRect()
    )
    if (marks.length === 0) return
    const r = box.getBoundingClientRect()
    const l = Math.min(...marks.map((b) => b.left)) - r.left
    const rr = Math.max(...marks.map((b) => b.right)) - r.left
    const t = Math.min(...marks.map((b) => b.top)) - r.top
    const b = Math.max(...marks.map((m) => m.bottom)) - r.top
    const s = Math.min(
      FOCUS,
      (r.width * 0.8) / Math.max(1, rr - l),
      (r.height * 0.6) / Math.max(1, b - t)
    )
    if (s < FOCUS_MIN) return
    const timer = window.setTimeout(() => {
      apply(
        {
          s,
          x: r.width / 2 - ((l + rr) / 2) * s,
          y: r.height / 2 - ((t + b) / 2) * s
        },
        true
      )
    }, slow())
    return () => window.clearTimeout(timer)
  }, [target, apply])

  useEffect(() => {
    if (!onSharp) return
    const timer = window.setTimeout(() => onSharp(view.s), slow() * 4)
    return () => window.clearTimeout(timer)
  }, [view.s, onSharp])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const onWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      const gain = Math.abs(d) < 50 ? 0.01 : 0.0025
      around(viewRef.current.s * Math.exp(-d * gain), e.clientX, e.clientY, false)
    }
    let pinch: { d: number; s: number } | null = null
    let pan: { x: number; y: number } | null = null
    const span = (t: TouchList): { d: number; x: number; y: number } | null => {
      const a = t[0]
      const c = t[1]
      if (!a || !c) return null
      return {
        d: Math.hypot(a.clientX - c.clientX, a.clientY - c.clientY),
        x: (a.clientX + c.clientX) / 2,
        y: (a.clientY + c.clientY) / 2
      }
    }
    let mid: { x: number; y: number } | null = null
    const onStart = (e: TouchEvent): void => {
      const s = e.touches.length === 2 ? span(e.touches) : null
      if (s && s.d > 0) {
        e.preventDefault()
        pinch = { d: s.d, s: viewRef.current.s }
        mid = { x: s.x, y: s.y }
        pan = null
        return
      }
      const p = e.touches[0]
      if (e.touches.length === 1 && p && viewRef.current.s > 1) {
        pan = { x: p.clientX, y: p.clientY }
      }
    }
    const onMove = (e: TouchEvent): void => {
      if (pinch && mid) {
        const s = span(e.touches)
        if (!s) return
        e.preventDefault()
        const v = viewRef.current
        apply({ ...v, x: v.x + s.x - mid.x, y: v.y + s.y - mid.y }, false)
        mid = { x: s.x, y: s.y }
        around((pinch.s * s.d) / pinch.d, s.x, s.y, false)
        return
      }
      const p = e.touches[0]
      if (!pan || !p) return
      e.preventDefault()
      const v = viewRef.current
      apply({ ...v, x: v.x + p.clientX - pan.x, y: v.y + p.clientY - pan.y }, false)
      pan = { x: p.clientX, y: p.clientY }
    }
    const onEnd = (e: TouchEvent): void => {
      if (e.touches.length < 2) {
        pinch = null
        mid = null
      }
      if (e.touches.length === 0) pan = null
    }
    box.addEventListener('wheel', onWheel, { passive: false })
    box.addEventListener('touchstart', onStart, { passive: false })
    box.addEventListener('touchmove', onMove, { passive: false })
    box.addEventListener('touchend', onEnd)
    box.addEventListener('touchcancel', onEnd)
    return () => {
      box.removeEventListener('wheel', onWheel)
      box.removeEventListener('touchstart', onStart)
      box.removeEventListener('touchmove', onMove)
      box.removeEventListener('touchend', onEnd)
      box.removeEventListener('touchcancel', onEnd)
    }
  }, [apply, around])

  const grab = useRef<{ id: number; x: number; y: number } | null>(null)
  const zoomed = view.s > 1

  return (
    <div
      ref={boxRef}
      className={`ql-zoombox ${zoomed ? 'ql-zoombox-on' : ''}`}
      role="group"
      aria-label={label}
      onDoubleClick={(e) => {
        if (viewRef.current.s > 1) apply({ s: 1, x: 0, y: 0 }, true)
        else around(2, e.clientX, e.clientY, true)
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch' || e.button !== 0 || viewRef.current.s <= 1) return
        e.currentTarget.setPointerCapture(e.pointerId)
        grab.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        const g = grab.current
        if (!g || g.id !== e.pointerId) return
        const v = viewRef.current
        apply({ ...v, x: v.x + e.clientX - g.x, y: v.y + e.clientY - g.y }, false)
        grab.current = { id: g.id, x: e.clientX, y: e.clientY }
      }}
      onPointerUp={() => {
        grab.current = null
      }}
      onPointerCancel={() => {
        grab.current = null
      }}
    >
      <div
        className={`ql-zoombox-in ${glide ? 'ql-zoombox-glide' : ''}`}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}
        onTransitionEnd={() => setGlide(false)}
      >
        {children}
      </div>
    </div>
  )
}
