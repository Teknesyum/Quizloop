import { useCallback, useEffect, useRef } from 'react'
import { BizeUlasin, type BizeUlasinLabels } from '../../../../teknesyum-ui/bildirim/BizeUlasin'
import { useLayer } from '@renderer/hooks/useLayer'
import { lang, t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const found = import.meta.glob<readonly string[]>(
  '../../../../teknesyum-ui/bildirim/bildirim.anahtar.ts',
  { eager: true, import: 'ANAHTAR' }
)
const ANAHTAR: readonly string[] = Object.values(found)[0] ?? []

function labels(): BizeUlasinLabels {
  return {
    title: t('contact.title'),
    note: t('contact.note'),
    noteHint: t('contact.noteHint'),
    contact: t('contact.reach'),
    contactHint: t('contact.reachHint'),
    addImage: t('contact.addImage'),
    removeImage: t('contact.removeImage'),
    imageReady: (name) => t('contact.imageReady', { name }),
    imageFailed: t('contact.imageFailed'),
    send: t('contact.send'),
    retry: t('contact.retry'),
    sending: t('contact.sending'),
    noteNeeded: t('contact.noteNeeded'),
    unavailable: t('contact.unavailable'),
    sent: t('contact.sent'),
    sentNoImage: t('contact.sentNoImage'),
    failed: {
      network: t('contact.failNetwork'),
      auth: t('contact.failAuth'),
      forbidden: t('contact.failForbidden'),
      server: t('contact.failServer')
    }
  }
}

const PLATFORM: Record<string, string> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
  android: 'Android',
  web: 'Web'
}

export function ContactDialog(): React.JSX.Element | null {
  const open = useApp((s) => s.contact)
  const showContact = useApp((s) => s.showContact)
  const info = useApp((s) => s.info)
  const panel = useRef<HTMLDivElement>(null)
  const close = useCallback(() => showContact(false), [showContact])

  useLayer(panel, close)

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, close])

  if (!open) return null
  const platform = info ? (PLATFORM[info.platform] ?? info.platform) : navigator.userAgent

  return (
    <div className="tk-modal-scrim" data-tk-modal="contact" role="presentation">
      <div
        ref={panel}
        className="tk-panel tk-modal ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-label={t('contact.title')}
      >
        <BizeUlasin
          app="QuizLoop"
          version={info?.version ?? ''}
          anahtar={ANAHTAR}
          platform={platform}
          lang={lang}
          labels={labels()}
          disabled={ANAHTAR.length === 0}
        />
        <div className="tk-modal-actions">
          <button type="button" className="tk-btn tk-btn-ghost" onClick={close}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
