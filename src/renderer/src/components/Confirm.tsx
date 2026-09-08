import { useEffect } from 'react'
import { t } from '@renderer/i18n'

interface Props {
  text: string
  danger?: boolean
  onYes(): void
  onNo(): void
}

export function Confirm({ text, danger, onYes, onNo }: Props): React.JSX.Element {
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') onNo()
      if (e.code === 'Enter') onYes()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onYes, onNo])
  return (
    <div className="tk-modal-scrim" data-tk-modal="confirm" role="presentation">
      <div
        className="tk-panel tk-modal ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-label={text}
      >
        <p className="tk-modal-body">{text}</p>
        <div className="tk-modal-actions">
          <button type="button" className="tk-btn tk-btn-ghost" onClick={onNo} autoFocus>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`tk-btn ${danger ? 'tk-btn-danger' : 'tk-btn-primary'}`}
            onClick={onYes}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
