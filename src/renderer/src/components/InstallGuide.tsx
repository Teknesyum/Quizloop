import { useCallback, useEffect, useId, useRef } from 'react'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

type Step = 'downloads' | 'android' | 'quickShare' | 'desktop'

function guideSteps(platform: string | undefined): Step[] {
  if (platform === 'android') return ['android', 'quickShare', 'downloads', 'desktop']
  if (platform === 'web' || !platform) return ['downloads', 'android', 'quickShare', 'desktop']
  return ['desktop', 'downloads', 'android', 'quickShare']
}

interface Props {
  onPick(): void
  onClose(): void
}

export function InstallGuide({ onPick, onClose }: Props): React.JSX.Element {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const platform = useApp((s) => s.info?.platform)
  const close = useCallback(() => onClose(), [onClose])
  useLayer(panel, close)

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [close])

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
          {t('library.guide.title')}
        </p>
        <ul className="ql-guide-list">
          {guideSteps(platform).map((s, i) => (
            <li key={s} className={i === 0 ? 'ql-guide-first' : 'tk-hint'}>
              {t(`library.guide.${s}`)}
            </li>
          ))}
        </ul>
        <div className="tk-modal-actions">
          <button type="button" className="tk-btn tk-btn-ghost" onClick={close}>
            {t('common.cancel')}
          </button>
          <button type="button" className="tk-btn tk-btn-primary" onClick={onPick} autoFocus>
            {t('library.guide.go')}
          </button>
        </div>
      </div>
    </div>
  )
}
