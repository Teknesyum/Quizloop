import { useEffect, useRef, useState } from 'react'
import { useApp, type Toast } from '@renderer/store/app'
import { t } from '@renderer/i18n'

const TOAST_MAX = 3

const ICON: Record<string, string> = { success: '✓', warning: '!', danger: '✕' }

function Item({ x, i }: { x: Toast; i: number }): React.JSX.Element {
  const dismiss = useApp((s) => s.dismiss)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const left = useRef(x.life ?? 0)
  const held = hover || focus
  useEffect(() => {
    if (!x.life || held || x.leaving) return
    const start = performance.now()
    const id = setTimeout(() => dismiss(x.id), Math.max(0, left.current))
    return () => {
      clearTimeout(id)
      left.current -= performance.now() - start
    }
  }, [held, x.life, x.leaving, x.id, dismiss])
  return (
    <div
      className={`tk-panel tk-toast tk-toast-${x.kind} ql-transition-in`}
      style={{ '--ql-i': i } as React.CSSProperties}
      data-tk-kapaniyor={x.leaving ? '1' : undefined}
      role={x.kind === 'danger' ? 'alert' : 'status'}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
      }}
    >
      <span className="tk-toast-icon" aria-hidden="true">
        {ICON[x.kind]}
      </span>
      <div className="tk-toast-body">
        <div className="tk-toast-title">{t(`toast.title.${x.kind}`)}</div>
        {x.text}
      </div>
      <button
        type="button"
        className="tk-toast-close tk-no-drag"
        onClick={() => dismiss(x.id)}
        aria-label={t('toast.close')}
      >
        ×
      </button>
    </div>
  )
}

export function Toasts(): React.JSX.Element {
  const toasts = useApp((s) => s.toasts)
  return (
    <div className="tk-toast-stack">
      {toasts.slice(-TOAST_MAX).map((x, i) => (
        <Item key={x.id} x={x} i={i} />
      ))}
    </div>
  )
}
