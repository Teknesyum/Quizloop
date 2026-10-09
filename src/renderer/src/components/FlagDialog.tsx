import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'

const NOTE_MAX = 2000

export function FlagDialog({
  onPick,
  onClose
}: {
  onPick(note?: string): Promise<void>
  onClose(): void
}): React.JSX.Element {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const [faulty, setFaulty] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const cancel = useCallback((): void => {
    if (!busy) onClose()
  }, [busy, onClose])

  useLayer(panel, cancel)

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') cancel()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [cancel])

  const pick = async (note?: string): Promise<void> => {
    if (busy) return
    setBusy(true)
    await onPick(note)
    setBusy(false)
  }

  return (
    <div className="tk-modal-scrim" data-tk-modal="flag" role="presentation">
      <div
        ref={panel}
        className="tk-panel tk-modal ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        {faulty ? (
          <>
            <label className="tk-h3" id={id} htmlFor={`${id}-note`}>
              {t('flag.faultyTitle')}
            </label>
            <p className="tk-hint">{t('flag.faultyHelp')}</p>
            <textarea
              id={`${id}-note`}
              className="tk-input ql-report-note"
              rows={4}
              maxLength={NOTE_MAX}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="tk-modal-actions">
              <button
                type="button"
                className="tk-btn tk-btn-ghost"
                onClick={() => setFaulty(false)}
                disabled={busy}
                title={busy ? t('common.loading') : undefined}
              >
                {t('flag.back')}
              </button>
              <button
                type="button"
                className="tk-btn tk-btn-primary"
                onClick={() => void pick(text.trim())}
                disabled={busy || !text.trim()}
                title={busy ? t('common.loading') : !text.trim() ? t('flag.needNote') : undefined}
              >
                {t('flag.faultySend')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="tk-h3" id={id}>
              {t('flag.title')}
            </h3>
            <div className="ql-flag-picks">
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-flag-pick"
                onClick={() => void pick()}
                disabled={busy}
                title={busy ? t('common.loading') : undefined}
                autoFocus
              >
                <span>{t('flag.save')}</span>
                <span className="tk-hint">{t('flag.saveHelp')}</span>
              </button>
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-flag-pick"
                onClick={() => setFaulty(true)}
                disabled={busy}
                title={busy ? t('common.loading') : undefined}
              >
                <span>{t('flag.faulty')}</span>
                <span className="tk-hint">{t('flag.faultyPickHelp')}</span>
              </button>
            </div>
            <div className="tk-modal-actions">
              <button type="button" className="tk-btn tk-btn-ghost" onClick={cancel}>
                {t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
