import { useEffect, useId, useRef } from 'react'
import type { NewsEntry } from '@shared/news'
import { useLayer } from '@renderer/hooks/useLayer'
import { lang, t } from '@renderer/i18n'

interface Props {
  entries: NewsEntry[]
  onClose(): void
}

export function WhatsNew({ entries, onClose }: Props): React.JSX.Element {
  const id = useId()
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
        className="tk-panel tk-modal ql-welcome ql-news ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <p className="tk-h3" id={id}>
          {t('news.title')}
        </p>
        <ol className="ql-welcome-list">
          {entries.map((n, i) => (
            <li
              key={n.version}
              className="ql-transition-in"
              style={{ '--ql-i': i + 1 } as React.CSSProperties}
            >
              <p className="tk-label tk-mono">{`v${n.version}`}</p>
              <ul className="ql-news-items">
                {n[lang].map((line) => (
                  <li key={line} className="tk-modal-body ql-transition-in">
                    {line}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="tk-hint">{t('news.again')}</p>
        <div className="tk-modal-actions">
          <button ref={ok} type="button" className="tk-btn tk-btn-primary" onClick={onClose}>
            {t('news.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
