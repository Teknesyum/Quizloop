import { useApp } from '@renderer/store/app'
import { t } from '@renderer/i18n'

const TOAST_MAX = 3

const ICON: Record<string, string> = { success: '✓', warning: '!', danger: '✕' }

export function Toasts(): React.JSX.Element {
  const toasts = useApp((s) => s.toasts)
  const dismiss = useApp((s) => s.dismiss)
  return (
    <div className="tk-toast-stack">
      {toasts.slice(-TOAST_MAX).map((x, i) => (
        <div
          key={x.id}
          className={`tk-panel tk-toast tk-toast-${x.kind} ql-transition-in`}
          style={{ '--ql-i': i } as React.CSSProperties}
          data-tk-kapaniyor={x.leaving ? '1' : undefined}
          role={x.kind === 'danger' ? 'alert' : 'status'}
        >
          <span className="tk-toast-icon" aria-hidden="true">
            {ICON[x.kind]}
          </span>
          <span className="tk-toast-body">{x.text}</span>
          <button
            type="button"
            className="tk-toast-close tk-no-drag"
            onClick={() => dismiss(x.id)}
            aria-label={t('toast.close')}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
