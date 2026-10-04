import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FONT_SCALES } from '@shared/ipc'
import { t } from '@renderer/i18n'
import { nextScale } from '@renderer/scale'

const LAST = FONT_SCALES.length - 1

function indexOf(scale: number): number {
  const i = FONT_SCALES.indexOf(scale as (typeof FONT_SCALES)[number])
  return i === -1 ? FONT_SCALES.indexOf(1) : i
}

export function ScaleSwitch({
  scale,
  onChange
}: {
  scale: number
  onChange(next: number): void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<number | null>(null)
  const [spot, setSpot] = useState<{ right: number; top: number } | null>(null)
  const group = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const down = nextScale(scale, -1)
  const up = nextScale(scale, 1)
  const at = draft ?? indexOf(scale)
  const shown = FONT_SCALES[at] ?? 1
  const placed = spot !== null

  useLayoutEffect(() => {
    if (!open) return
    const place = (): void => {
      const r = group.current?.getBoundingClientRect()
      if (r) setSpot({ right: window.innerWidth - r.right, top: r.bottom })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, scale])

  useEffect(() => {
    if (!open) return
    pop.current?.querySelector<HTMLElement>('input')?.focus()
    const close = (): void => {
      setOpen(false)
      setDraft(null)
    }
    const press = (e: PointerEvent): void => {
      const hit = e.target as Node
      if (!pop.current?.contains(hit) && !group.current?.contains(hit)) close()
    }
    const key = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    document.addEventListener('pointerdown', press)
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('keydown', key, true)
    }
  }, [open, placed])

  const commit = (): void => {
    if (draft === null) return
    const next = FONT_SCALES[draft] ?? 1
    setDraft(null)
    if (next !== scale) onChange(next)
  }

  return (
    <div ref={group} className="ql-scale" role="group" aria-label={t('scale.label')}>
      <button
        type="button"
        className="ql-scale__btn"
        aria-label={t('scale.down')}
        title={t('scale.down')}
        disabled={down === scale}
        onClick={() => onChange(down)}
      >
        −
      </button>
      <button
        type="button"
        className="ql-scale__btn ql-scale__value"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('scale.open')}
        title={t('scale.open')}
        onClick={() => setOpen((o) => !o)}
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        type="button"
        className="ql-scale__btn"
        aria-label={t('scale.up')}
        title={t('scale.up')}
        disabled={up === scale}
        onClick={() => onChange(up)}
      >
        +
      </button>
      {open &&
        spot &&
        createPortal(
          <div
            ref={pop}
            className="tk-panel ql-scale-pop ql-transition-in"
            role="dialog"
            aria-label={t('scale.label')}
            style={spot}
          >
            <input
              type="range"
              className="ql-scale-range"
              min={0}
              max={LAST}
              step={1}
              value={at}
              aria-label={t('scale.label')}
              aria-valuetext={`${Math.round(shown * 100)}%`}
              onChange={(e) => setDraft(Number(e.target.value))}
              onPointerUp={commit}
              onKeyUp={commit}
              onBlur={commit}
            />
            <span className="tk-mono ql-scale-pct">{Math.round(shown * 100)}%</span>
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              disabled={scale === 1 && draft === null}
              title={t('scale.reset')}
              onClick={() => {
                setDraft(null)
                onChange(1)
              }}
            >
              {t('scale.resetShort')}
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}
