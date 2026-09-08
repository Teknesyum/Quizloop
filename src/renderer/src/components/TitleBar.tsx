import { useEffect, useState } from 'react'
import { t } from '@renderer/i18n'

const GITHUB = 'https://github.com/Teknesyum'
const SPONSOR = 'https://github.com/sponsors/Teknesyum'

function Icon({ d }: { d: string }): React.JSX.Element {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function TitleBar(): React.JSX.Element {
  const [max, setMax] = useState(false)
  useEffect(() => {
    window.quizloop.window.isMaximized().then(setMax)
    return window.quizloop.window.onMaximized(setMax)
  }, [])
  const w = window.quizloop.window
  return (
    <header className="tk-titlebar ql-titlebar">
      <div className="ql-titlebar-brand">
        <span className="ql-titlebar-mark" aria-hidden="true" />
        <span className="tk-label">{t('app.name')}</span>
      </div>
      <div className="ql-titlebar-right">
        <div className="ql-signature tk-no-drag">
          <a href={GITHUB} target="_blank" rel="noreferrer" title={t('sig.github')}>
            {t('sig.by')}
          </a>
          <a
            href={SPONSOR}
            target="_blank"
            rel="noreferrer"
            title={t('sig.sponsor')}
            aria-label={t('sig.sponsor')}
          >
            ☕
          </a>
        </div>
        <div className="ql-win-controls tk-no-drag">
          <button
            type="button"
            onClick={() => w.minimize()}
            aria-label={t('win.minimize')}
            title={t('win.minimize')}
          >
            <Icon d="M1 5.5h8" />
          </button>
          <button
            type="button"
            onClick={() => w.toggleMaximize()}
            aria-label={max ? t('win.restore') : t('win.maximize')}
            title={max ? t('win.restore') : t('win.maximize')}
          >
            {max ? <Icon d="M2.5 3.5v-2h6v6h-2M1.5 3.5h5v5h-5z" /> : <Icon d="M1.5 1.5h7v7h-7z" />}
          </button>
          <button
            type="button"
            className="ql-win-close"
            onClick={() => w.close()}
            aria-label={t('win.close')}
            title={t('win.close')}
          >
            <Icon d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
          </button>
        </div>
      </div>
    </header>
  )
}
