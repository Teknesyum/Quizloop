import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

interface Props {
  title: string
  text: string
  danger?: boolean
  yes?: string
  onYes(): void | Promise<void>
  onNo(): void
}

export function Confirm({ title, text, danger, yes, onYes, onNo }: Props): React.JSX.Element {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async (): Promise<void> => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await onYes()
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e)
      useApp.getState().toast('danger', `${t('common.error')}: ${why}`)
      onNo()
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [onYes, onNo])

  const cancel = useCallback((): void => {
    if (!lock.current) onNo()
  }, [onNo])

  useLayer(panel, cancel)

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') cancel()
      if (e.code !== 'Enter' || e.repeat) return
      if (e.target instanceof Element && e.target.closest('button')) return
      void run()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [run, cancel])

  return (
    <div className="tk-modal-scrim" data-tk-modal="confirm" role="presentation">
      <div
        ref={panel}
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
          <button
            type="button"
            className="tk-btn tk-btn-ghost"
            onClick={cancel}
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
            autoFocus
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`tk-btn ${danger ? 'tk-btn-danger' : 'tk-btn-primary'}`}
            onClick={() => void run()}
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
          >
            {yes ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
