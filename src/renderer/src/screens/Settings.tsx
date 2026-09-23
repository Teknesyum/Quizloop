import { useEffect, useState } from 'react'
import { FONT_SCALES, type Settings as S } from '@shared/ipc'
import { Confirm } from '@renderer/components/Confirm'
import { Skeleton } from '@renderer/components/Skeleton'
import { useUpdate } from '@renderer/hooks/useUpdate'
import { t, type Key } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const SPEEDS: S['typerSpeed'][] = ['slow', 'normal', 'fast', 'off']

export function Settings(): React.JSX.Element {
  const settings = useApp((s) => s.settings)
  const info = useApp((s) => s.info)
  const save = useApp((s) => s.saveSettings)
  const loadInfo = useApp((s) => s.loadInfo)
  const toast = useApp((s) => s.toast)
  const up = useUpdate()
  const [importing, setImporting] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!info) loadInfo()
  }, [info, loadInfo])

  const apply = async (patch: Partial<S>): Promise<void> => {
    await save(patch)
    toast('success', t('settings.saved'))
  }

  const upLine = (): string => {
    const v = { version: up.version ?? '', percent: up.percent ?? 0 }
    if (up.state === 'checking') return t('update.checking')
    if (up.state === 'none') return t('update.none')
    if (up.state === 'available') return t('update.available', v)
    if (up.state === 'downloading') return t('update.downloading', v)
    if (up.state === 'ready') return t('update.ready', v)
    if (up.state === 'notice') return t('update.notice', v)
    if (up.state === 'error') return t('update.error')
    return ''
  }

  const exportPkg = async (): Promise<void> => {
    setBusy(true)
    try {
      const r = await window.quizloop.transfer.exportTo()
      if (r.ok)
        toast(
          'success',
          t('settings.transferExported', { modules: r.modules ?? 0, path: r.path ?? '' })
        )
      else if (r.error) toast('danger', `${t('settings.transferFailed')}: ${r.error}`)
    } finally {
      setBusy(false)
    }
  }

  const importPkg = async (): Promise<void> => {
    setImporting(false)
    setBusy(true)
    try {
      const r = await window.quizloop.transfer.importFrom()
      if (r.ok) toast('success', t('settings.transferImported'))
      else if (r.error === 'not-a-package') toast('danger', t('settings.transferNotPackage'))
      else if (r.error) toast('danger', `${t('settings.transferFailed')}: ${r.error}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('settings.title')}</h2>
          <p className="tk-hint">{t('settings.subtitle')}</p>
        </div>
      </header>

      {!settings && (
        <div className="tk-panel">
          <Skeleton lines={6} />
        </div>
      )}

      {settings && (
        <div className="ql-settings">
          <div className="tk-panel ql-transition-in">
            <div className="tk-field">
              <label className="tk-label" htmlFor="dayStart">
                {t('settings.dayStart')}
              </label>
              <input
                id="dayStart"
                className="tk-input tk-mono"
                type="number"
                min={0}
                max={23}
                value={settings.dayStartHour}
                onChange={(e) => apply({ dayStartHour: Number(e.target.value) })}
              />
              <span className="tk-hint">{t('settings.dayStartHelp')}</span>
            </div>

            <div className="tk-field">
              <label className="tk-label" htmlFor="sessionLimit">
                {t('settings.sessionLimit')}
              </label>
              <input
                id="sessionLimit"
                className="tk-input tk-mono"
                type="number"
                min={5}
                max={200}
                value={settings.sessionLimit}
                onChange={(e) => apply({ sessionLimit: Number(e.target.value) })}
              />
              <span className="tk-hint">{t('settings.sessionLimitHelp')}</span>
            </div>

            <div className="tk-field">
              <label className="tk-label" htmlFor="blinkSeconds">
                {t('settings.blink')}
              </label>
              <input
                id="blinkSeconds"
                className="tk-input tk-mono"
                type="number"
                min={0}
                max={30}
                value={settings.blinkSeconds}
                onChange={(e) =>
                  apply({ blinkSeconds: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })
                }
              />
              <span className="tk-hint">{t('settings.blinkHelp')}</span>
            </div>

            <div className="tk-field">
              <span className="tk-label">{t('settings.typer')}</span>
              <div className="ql-segment" role="radiogroup" aria-label={t('settings.typer')}>
                {SPEEDS.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    role="radio"
                    aria-checked={settings.typerSpeed === sp}
                    className={`tk-btn ${settings.typerSpeed === sp ? 'tk-btn-primary' : 'tk-btn-ghost'} ql-btn-sm`}
                    onClick={() => apply({ typerSpeed: sp })}
                  >
                    {t(`settings.typer.${sp}` as Key)}
                  </button>
                ))}
              </div>
              <span className="tk-hint">{t('settings.typerHelp')}</span>
            </div>

            <div className="tk-field">
              <span className="tk-label">{t('settings.fontScale')}</span>
              <div className="ql-segment" role="radiogroup" aria-label={t('settings.fontScale')}>
                {FONT_SCALES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={settings.fontScale === f}
                    className={`tk-btn ${settings.fontScale === f ? 'tk-btn-primary' : 'tk-btn-ghost'} ql-btn-sm tk-mono`}
                    onClick={() => apply({ fontScale: f })}
                  >
                    {Math.round(f * 100)}%
                  </button>
                ))}
              </div>
              <span className="tk-hint">{t('settings.fontScaleHelp')}</span>
            </div>

            <div className="tk-field">
              <span className="tk-label">{t('settings.modulesDir')}</span>
              <div className="ql-dir-row">
                <code
                  className="tk-input tk-mono ql-dir-value"
                  aria-label={t('settings.modulesDir')}
                >
                  {settings.modulesDir ?? t('settings.modulesDirDefault')}
                </code>
                <button
                  type="button"
                  className="tk-btn tk-btn-ghost ql-btn-sm"
                  onClick={async () => {
                    const dir = await window.quizloop.settings.pickModulesDir()
                    if (dir) apply({ modulesDir: dir })
                  }}
                >
                  {t('settings.pick')}
                </button>
                {settings.modulesDir && (
                  <button
                    type="button"
                    className="tk-btn tk-btn-ghost ql-btn-sm"
                    onClick={() => apply({ modulesDir: null })}
                  >
                    {t('settings.reset')}
                  </button>
                )}
              </div>
              <span className="tk-hint">{t('settings.modulesDirHelp')}</span>
            </div>
          </div>

          <div className="tk-panel ql-transition-in" style={{ '--ql-i': 1 } as React.CSSProperties}>
            <h3 className="tk-h3 tk-h3-rule">{t('settings.transfer')}</h3>
            <p className="tk-hint">{t('settings.transferHelp')}</p>
            <div className="ql-row">
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm"
                disabled={busy}
                title={busy ? t('common.loading') : undefined}
                onClick={exportPkg}
              >
                {t('settings.transferExport')}
              </button>
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm"
                disabled={busy}
                title={busy ? t('common.loading') : undefined}
                onClick={() => setImporting(true)}
              >
                {t('settings.transferImport')}
              </button>
            </div>
          </div>

          <div className="tk-panel ql-transition-in" style={{ '--ql-i': 2 } as React.CSSProperties}>
            <h3 className="tk-h3 tk-h3-rule">{t('settings.updates')}</h3>
            <p className="tk-hint">{t('settings.updatesHelp')}</p>
            <div className="ql-row">
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm"
                disabled={up.state === 'checking' || up.state === 'downloading'}
                title={
                  up.state === 'checking' || up.state === 'downloading'
                    ? t('update.checking')
                    : undefined
                }
                onClick={() => window.quizloop.update.check()}
              >
                {t('update.check')}
              </button>
              {up.state === 'ready' && (
                <button
                  type="button"
                  className="tk-btn tk-btn-primary ql-btn-sm"
                  onClick={() => window.quizloop.update.install()}
                >
                  {t('update.restart')}
                </button>
              )}
              {up.state === 'notice' && (
                <button
                  type="button"
                  className="tk-btn tk-btn-ghost ql-btn-sm"
                  onClick={() => window.quizloop.update.open()}
                >
                  {t('update.open')}
                </button>
              )}
              <span className="tk-hint" role="status">
                {upLine()}
              </span>
            </div>
          </div>

          <div
            className="tk-panel ql-transition-in ql-about"
            style={{ '--ql-i': 3 } as React.CSSProperties}
          >
            <h3 className="tk-h3 tk-h3-rule">{t('settings.about')}</h3>
            <p className="tk-hint">
              {info ? t('settings.version', { version: info.version }) : t('common.loading')}
            </p>
            <p className="tk-hint">{t('settings.license')}</p>
            {info && (
              <p className={info.integrity.ok ? 'tk-hint' : 'tk-danger-text'}>
                <span
                  className={`tk-dot ${info.integrity.ok ? 'tk-dot-on' : 'tk-dot-off'}`}
                  aria-hidden="true"
                />{' '}
                {info.integrity.ok
                  ? t('settings.integrityOk')
                  : `${t('settings.integrityBad')}: ${info.integrity.detail}`}
              </p>
            )}
          </div>
        </div>
      )}

      {importing && (
        <Confirm
          text={t('settings.transferConfirm')}
          danger
          onNo={() => setImporting(false)}
          onYes={importPkg}
        />
      )}
    </section>
  )
}
