import { useEffect, useId } from 'react'
import { t } from '@renderer/i18n'

interface Props {
  title: string
  text: string
  danger?: boolean
  yes?: string
  onYes(): void
  onNo(): void
}

export function Confirm({ title, text, danger, yes, onYes, onNo }: Props): React.JSX.Element {
  const id = useId()
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
        aria-labelledby={id}
      >
        <p className="tk-h3" id={id}>
          {title}
        </p>
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
            {yes ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
