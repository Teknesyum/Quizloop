import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from 'react'
import {
  sendFeedback,
  shrinkImage,
  type FeedbackFailure
} from '../../../../teknesyum-ui/bildirim/bildirim'
import '../../../../teknesyum-ui/bildirim/bizeulasin.css'
import { captureScreen } from '@renderer/bildirim'
import { useLayer } from '@renderer/hooks/useLayer'
import { lang, t, type Key } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const found = import.meta.glob<readonly string[]>(
  '../../../../teknesyum-ui/bildirim/bildirim.anahtar.ts',
  { eager: true, import: 'ANAHTAR' }
)
const ANAHTAR: readonly string[] = Object.values(found)[0] ?? []

const SHOT_WIDTH = 1600

const PLATFORM: Record<string, string> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
  android: 'Android',
  web: 'Web'
}

const FAILED: Record<FeedbackFailure, Key> = {
  network: 'contact.failNetwork',
  auth: 'contact.failAuth',
  forbidden: 'contact.failForbidden',
  server: 'contact.failServer'
}

type Status = { kind: 'idle' | 'sending' | 'sent' | 'failed'; text: string }

type Image = { blob: Blob; url: string }

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

async function prepare(source: Blob): Promise<Image | null> {
  const blob = await shrinkImage(source)
  if (!blob) return null
  try {
    return { blob, url: await toDataUrl(blob) }
  } catch {
    return null
  }
}

export function ContactDialog(): React.JSX.Element | null {
  const open = useApp((s) => s.contact)
  return open ? <ContactPanel /> : null
}

function ContactPanel(): React.JSX.Element {
  const showContact = useApp((s) => s.showContact)
  const info = useApp((s) => s.info)
  const panel = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const touched = useRef(false)
  const id = useId()
  const [note, setNote] = useState('')
  const [contact, setContact] = useState('')
  const [image, setImage] = useState<Image | null>(null)
  const [imageNote, setImageNote] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })
  const close = useCallback(() => showContact(false), [showContact])

  useLayer(panel, close)

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [close])

  useEffect(() => {
    let live = true
    void (async () => {
      const raw = await captureScreen(SHOT_WIDTH)
      const ready = raw ? await prepare(raw) : null
      if (live && ready && !touched.current) setImage(ready)
    })()
    return () => {
      live = false
    }
  }, [])

  const platform = info ? (PLATFORM[info.platform] ?? info.platform) : navigator.userAgent
  const disabled = ANAHTAR.length === 0
  const busy = status.kind === 'sending'
  const off = disabled || busy
  const why = busy ? t('contact.sending') : disabled ? t('contact.unavailable') : undefined

  const pick = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    touched.current = true
    const ready = await prepare(file)
    if (ready) setImage(ready)
    setImageNote(ready ? '' : t('contact.imageFailed'))
  }

  const drop = (): void => {
    touched.current = true
    setImage(null)
    setImageNote('')
  }

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (busy || !note.trim()) return
    setStatus({ kind: 'sending', text: t('contact.sending') })
    const result = await sendFeedback(
      {
        app: 'QuizLoop',
        version: info?.version ?? '',
        platform,
        lang,
        note,
        contact,
        image: image?.blob ?? null
      },
      ANAHTAR
    )
    if (!result.ok) {
      setStatus({ kind: 'failed', text: t(FAILED[result.reason]) })
      return
    }
    setStatus({
      kind: 'sent',
      text: result.imageFailed ? t('contact.sentNoImage') : t('contact.sent')
    })
    setNote('')
    drop()
  }

  return (
    <div
      className="tk-modal-scrim ql-contact-scrim"
      data-tk-modal="contact"
      data-ql-noshot=""
      role="presentation"
    >
      <div
        ref={panel}
        className="tk-panel tk-modal ql-contact ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id + '-title'}
      >
        <form className="tk-feedback ql-contact-form" onSubmit={submit}>
          <h2 className="tk-h2" id={id + '-title'}>
            {t('contact.title')}
          </h2>
          <div className="tk-field">
            <label className="tk-label" htmlFor={id + '-note'}>
              {t('contact.note')}
            </label>
            <p className="tk-hint ql-contact-hint" id={id + '-note-hint'}>
              {t('contact.noteHint')}
            </p>
            <textarea
              className="tk-input tk-feedback__note ql-contact-note"
              id={id + '-note'}
              value={note}
              aria-invalid={false}
              aria-describedby={id + '-note-hint'}
              required
              disabled={off}
              title={why}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="tk-field">
            <label className="tk-label" htmlFor={id + '-contact'}>
              {t('contact.reach')}
            </label>
            <p className="tk-hint ql-contact-hint" id={id + '-contact-hint'}>
              {t('contact.reachHint')}
            </p>
            <input
              className="tk-input"
              id={id + '-contact'}
              type="text"
              autoComplete="email"
              value={contact}
              aria-invalid={false}
              aria-describedby={id + '-contact-hint'}
              disabled={off}
              title={why}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="tk-feedback__image ql-contact-image">
            <input ref={picker} type="file" accept="image/*" hidden tabIndex={-1} onChange={pick} />
            {image ? (
              <div className="ql-contact-thumb">
                <img src={image.url} alt="" />
                <button
                  type="button"
                  className="ql-contact-thumb-x"
                  aria-label={t('contact.removeImage')}
                  title={why ?? t('contact.removeImage')}
                  disabled={off}
                  onClick={drop}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="tk-btn"
              disabled={off}
              title={why}
              onClick={() => picker.current?.click()}
            >
              {t('contact.addImage')}
            </button>
            <p className="tk-hint tk-feedback__image-note" aria-live="polite">
              {imageNote}
            </p>
          </div>
          <div className="tk-feedback__actions">
            <p
              className="tk-feedback__status"
              data-kind={status.kind}
              role="status"
              aria-live="polite"
            >
              {status.text}
            </p>
            <button
              type="submit"
              className="tk-btn tk-btn-primary"
              disabled={off || !note.trim()}
              title={why ?? (note.trim() ? undefined : t('contact.noteNeeded'))}
            >
              {status.kind === 'failed' ? t('contact.retry') : t('contact.send')}
            </button>
          </div>
        </form>
        <div className="tk-modal-actions">
          <button type="button" className="tk-btn tk-btn-ghost" onClick={close}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
