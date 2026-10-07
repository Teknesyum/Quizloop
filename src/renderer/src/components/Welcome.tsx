import { useEffect, useId, useRef } from 'react'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'

interface Props {
  onClose(): void
}

const NOTES = ['module', 'add', 'study', 'data'] as const

export function Welcome({ onClose }: Props): React.JSX.Element {
  const id = useId()
  const phone = window.quizloop.capabilities.packageImport
  const ok = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useLayer(panel, onClose)
  useEffect(() => ok.current?.focus({ preventScroll: true }), [])
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="tk-modal-scrim" data-tk-modal="confirm" role="presentation">
      <div
        ref={panel}
        className="tk-panel tk-modal ql-welcome ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <p className="tk-h3" id={id}>
          {t('welcome.title')}
        </p>
        <p className="tk-hint">{t('welcome.lead')}</p>
        <ol className="ql-welcome-list">
          {NOTES.map((n, i) => (
            <li
              key={n}
              className="ql-transition-in"
              style={{ '--ql-i': i + 1 } as React.CSSProperties}
            >
              <p className="tk-label">{t(`welcome.${n}.title`)}</p>
              <p className="tk-modal-body">
                {t(n === 'add' && phone ? 'welcome.add.bodyPackage' : `welcome.${n}.body`)}
              </p>
            </li>
          ))}
        </ol>
        <p className="tk-hint">{t('welcome.again')}</p>
        <div className="tk-modal-actions">
          <button ref={ok} type="button" className="tk-btn tk-btn-primary" onClick={onClose}>
            {t('welcome.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
