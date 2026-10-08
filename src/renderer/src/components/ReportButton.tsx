import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReportTicket } from '@shared/bildirim'
import { reportEnabled, sendNote, sendReport } from '@renderer/bildirim'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const NOTE_MAX = 2000
const OFFER_MS = 12000

function Note({ ticket, onClose }: { ticket: ReportTicket; onClose(): void }): React.JSX.Element {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useApp((s) => s.toast)

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

  const send = async (): Promise<void> => {
    const note = text.trim()
    if (!note || busy) return
    setBusy(true)
    try {
      await sendNote(ticket, note)
      toast('success', t('report.noteSent'))
      onClose()
    } catch {
      toast('danger', t('report.failed'))
      setBusy(false)
    }
  }

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
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
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
            onClick={() => void send()}
            disabled={busy || !text.trim()}
            title={busy ? t('common.loading') : undefined}
          >
            {t('report.send')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ReportButton(): React.JSX.Element | null {
  const [busy, setBusy] = useState(false)
  const [ticket, setTicket] = useState<ReportTicket | null>(null)
  const toast = useApp((s) => s.toast)

  if (!reportEnabled) return null

  const report = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      const sent = await sendReport()
      toast('success', t('report.sent'), OFFER_MS, {
        label: t('report.addNote'),
        run: () => setTicket(sent)
      })
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
        onClick={() => void report()}
        disabled={busy}
        aria-label={t('report.button')}
        title={busy ? t('common.loading') : t('report.button')}
      >
        <span aria-hidden="true">!</span>
      </button>
      {ticket && <Note ticket={ticket} onClose={() => setTicket(null)} />}
    </>
  )
}
