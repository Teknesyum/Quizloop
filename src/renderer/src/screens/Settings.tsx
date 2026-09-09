import { useEffect } from 'react'
import { FONT_SCALES, type Settings as S } from '@shared/ipc'
import { Skeleton } from '@renderer/components/Skeleton'
import { t, type Key } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const SPEEDS: S['typerSpeed'][] = ['slow', 'normal', 'fast', 'off']

export function Settings(): React.JSX.Element {
  const settings = useApp((s) => s.settings)
  const info = useApp((s) => s.info)
  const save = useApp((s) => s.saveSettings)
  const loadInfo = useApp((s) => s.loadInfo)
  const toast = useApp((s) => s.toast)

  useEffect(() => {
    if (!info) loadInfo()
  }, [info, loadInfo])

  const apply = async (patch: Partial<S>): Promise<void> => {
    await save(patch)
    toast('success', t('settings.saved'))
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

          <div
            className="tk-panel ql-transition-in ql-about"
            style={{ '--ql-i': 1 } as React.CSSProperties}
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
    </section>
  )
}
