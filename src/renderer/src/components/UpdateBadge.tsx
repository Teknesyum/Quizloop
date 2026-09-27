import { useEffect, useRef } from 'react'
import { useUpdate } from '@renderer/hooks/useUpdate'
import { useApp } from '@renderer/store/app'
import { t } from '@renderer/i18n'

const UPDATED_LIFE = 5000

export function UpdateBadge(): React.JSX.Element | null {
  const up = useUpdate()
  const toast = useApp((s) => s.toast)
  const said = useRef(false)
  const v = { version: up.version ?? '' }
  useEffect(() => {
    if (up.state !== 'updated' || said.current) return
    said.current = true
    toast('success', t('update.updated', { version: up.version ?? '' }), UPDATED_LIFE)
  }, [up.state, up.version, toast])
  const u = window.quizloop.update
  if (up.state === 'available')
    return (
      <span className="ql-update" data-state="available" role="status">
        <span className="ql-update-dot" aria-hidden="true" />
        <span className="ql-update-text" title={t('update.download')}>
          {t('update.label')}
        </span>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-xs"
          onClick={() => u.download(false)}
        >
          {t('update.get')}
        </button>
        <button
          type="button"
          className="tk-btn tk-btn-primary ql-btn-xs"
          onClick={() => u.download(true)}
        >
          {t('update.downloadInstall')}
        </button>
      </span>
    )
  if (up.state === 'downloading')
    return (
      <span className="ql-update" data-state="downloading" role="status">
        <span className="ql-update-dot" aria-hidden="true" />
        <span className="ql-update-text">
          {t('update.downloading', { percent: up.percent ?? 0 })}
        </span>
        <button type="button" className="tk-btn tk-btn-ghost ql-btn-xs" onClick={() => u.cancel()}>
          {t('update.cancel')}
        </button>
      </span>
    )
  if (up.state === 'ready')
    return (
      <span className="ql-update" data-state="ready" role="status">
        <span className="ql-update-dot" aria-hidden="true" />
        <span className="ql-update-text" title={t('update.install')}>
          {t('update.label')}
        </span>
        <button
          type="button"
          className="tk-btn tk-btn-primary ql-btn-xs"
          onClick={() => u.install()}
        >
          {t('update.apply')}
        </button>
      </span>
    )
  if (up.state === 'notice')
    return (
      <span className="ql-update" data-state="available" role="status">
        <span className="ql-update-dot" aria-hidden="true" />
        <span className="ql-update-text" title={t('update.notice', v)}>
          {t('update.label')}
        </span>
        <button type="button" className="tk-btn tk-btn-ghost ql-btn-xs" onClick={() => u.open()}>
          {t('update.open')}
        </button>
      </span>
    )
  return null
}
