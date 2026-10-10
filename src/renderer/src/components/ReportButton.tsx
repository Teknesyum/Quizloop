import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { reportEnabled, sendReport } from '@renderer/bildirim'
import { Confirm } from '@renderer/components/Confirm'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const NOTE_MAX = 2000

interface FormProps {
  text: string
  shot: boolean
  busy: boolean
  onText(text: string): void
  onShot(on: boolean): void
  onSend(): void
  onClose(): void
}

function Form({ text, shot, busy, onText, onShot, onSend, onClose }: FormProps): React.JSX.Element {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const empty = !shot && !text.trim()

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

  return (
    <div className="tk-modal-scrim" data-tk-modal="report" data-ql-noshot="" role="presentation">
      <div
        ref={panel}
        className="tk-panel tk-modal ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <label className="tk-h3" id={id} htmlFor={`${id}-note`}>
          {t('report.noteTitle')}
        </label>
        <textarea
          id={`${id}-note`}
          className="tk-input ql-report-note"
          rows={4}
          maxLength={NOTE_MAX}
          value={text}
          onChange={(e) => onText(e.target.value)}
          disabled={busy}
          autoFocus
        />
        <label className="ql-report-shot">
          <input
            type="checkbox"
            checked={shot}
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
            onChange={(e) => onShot(e.target.checked)}
          />
          <span>{t('report.shot')}</span>
        </label>
        <p className="tk-hint">{t('report.shotHint')}</p>
        <div className="tk-modal-actions">
          <button
            type="button"
            className="tk-btn tk-btn-ghost"
            onClick={cancel}
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-primary"
            onClick={onSend}
            disabled={busy || empty}
            title={busy ? t('common.loading') : empty ? t('report.emptyHelp') : undefined}
          >
            {t('report.send')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ReportButton(): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState(false)
  const [text, setText] = useState('')
  const [shot, setShot] = useState(true)
  const [busy, setBusy] = useState(false)
  const toast = useApp((s) => s.toast)

  if (!reportEnabled) return null

  const close = (): void => {
    setOpen(false)
    setAsking(false)
    setText('')
    setShot(true)
  }

  const send = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      await sendReport(text.trim(), shot)
      toast('success', t('report.sent'))
      close()
    } catch {
      toast('danger', t('report.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="ql-report tk-no-drag"
        data-ql-noshot=""
        onClick={() => setOpen(true)}
        aria-label={t('report.button')}
        title={t('report.button')}
      >
        <span aria-hidden="true">!</span>
      </button>
      {open && !asking && (
        <Form
          text={text}
          shot={shot}
          busy={busy}
          onText={setText}
          onShot={(on) => (on ? setShot(true) : setAsking(true))}
          onSend={() => void send()}
          onClose={close}
        />
      )}
      {open && asking && (
        <Confirm
          title={t('report.shotOffTitle')}
          text={t('report.shotOffText')}
          yes={t('report.shotOffYes')}
          onNo={() => setAsking(false)}
          onYes={() => {
            setShot(false)
            setAsking(false)
          }}
        />
      )}
    </>
  )
}
