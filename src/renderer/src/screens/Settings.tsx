import { useEffect, useState } from 'react'
import { FONT_SCALES, SOURCE_URL, type Settings as S } from '@shared/ipc'
import { Confirm } from '@renderer/components/Confirm'
import { Skeleton } from '@renderer/components/Skeleton'
import { useUpdate } from '@renderer/hooks/useUpdate'
import { t, type Key } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { THEMES, type Theme } from '@renderer/theme'

const SPEEDS: S['typerSpeed'][] = ['slow', 'normal', 'fast', 'off']

function swatch(th: Theme): React.CSSProperties {
  return {
    '--ql-sw-bg': th.black,
    '--ql-sw-text': th.text,
    '--ql-sw-1': th['renk-1'],
    '--ql-sw-2': th['renk-2'],
    '--ql-sw-3': th['renk-3']
  } as React.CSSProperties
}

function NumberField({
  id,
  min,
  max,
  value,
  onCommit
}: {
  id: string
  min: number
  max: number
  value: number
  onCommit(n: number): void
}): React.JSX.Element {
  const [draft, setDraft] = useState(String(value))
  const commit = (text: string): void => {
    const n = Math.round(Number(text))
    const next = text.trim() === '' || !Number.isFinite(n) ? value : Math.max(min, Math.min(max, n))
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }
  return (
    <input
      id={id}
      className="tk-input tk-mono"
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => commit(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

export function Settings(): React.JSX.Element {
  const settings = useApp((s) => s.settings)
  const info = useApp((s) => s.info)
  const save = useApp((s) => s.saveSettings)
  const loadInfo = useApp((s) => s.loadInfo)
  const toast = useApp((s) => s.toast)
  const up = useUpdate()
  const caps = window.quizloop.capabilities
  const [importing, setImporting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sampling, setSampling] = useState(false)

  useEffect(() => {
    if (!info) loadInfo()
  }, [info, loadInfo])

  const installSamples = async (): Promise<void> => {
    setSampling(false)
    setBusy(true)
    try {
      const r = await window.quizloop.module.installSample()
      await useApp.getState().loadModules()
      if (r?.ok) toast('success', t('settings.samplesInstalled'))
      else toast('danger', t('library.installFailed'))
    } finally {
      setBusy(false)
    }
  }

  const apply = async (patch: Partial<S>): Promise<void> => {
    try {
      await save(patch)
      toast('success', t('settings.saved'))
    } catch (e) {
      toast('danger', `${t('common.error')}: ${e instanceof Error ? e.message : String(e)}`)
    }
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
          <p className="tk-hint">
            {t(caps.settingsFile ? 'settings.subtitle' : 'settings.subtitleNative')}
          </p>
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
              <NumberField
                key={settings.dayStartHour}
                id="dayStart"
                min={0}
                max={23}
                value={settings.dayStartHour}
                onCommit={(n) => apply({ dayStartHour: n })}
              />
              <span className="tk-hint">{t('settings.dayStartHelp')}</span>
            </div>

            <div className="tk-field">
              <label className="tk-label" htmlFor="sessionLimit">
                {t('settings.sessionLimit')}
              </label>
              <NumberField
                key={settings.sessionLimit}
                id="sessionLimit"
                min={5}
                max={200}
                value={settings.sessionLimit}
                onCommit={(n) => apply({ sessionLimit: n })}
              />
              <span className="tk-hint">{t('settings.sessionLimitHelp')}</span>
            </div>

            <div className="tk-field">
              <label className="tk-label" htmlFor="blinkSeconds">
                {t('settings.blink')}
              </label>
              <NumberField
                key={settings.blinkSeconds}
                id="blinkSeconds"
                min={0}
                max={30}
                value={settings.blinkSeconds}
                onCommit={(n) => apply({ blinkSeconds: n })}
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
              <span className="tk-label">{t('settings.theme')}</span>
              <div className="ql-themes" role="radiogroup" aria-label={t('settings.theme')}>
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    role="radio"
                    aria-checked={settings.theme === th.id}
                    className="ql-theme"
                    style={swatch(th)}
                    onClick={() => apply({ theme: th.id })}
                  >
                    <span className="ql-theme-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="ql-theme-name">{th.ad}</span>
                  </button>
                ))}
              </div>
              <span className="tk-hint">{t('settings.themeHelp')}</span>
            </div>

            {!caps.windowChrome && (
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
                <span className="tk-hint">
                  {t(caps.shortcuts ? 'settings.fontScaleHelp' : 'settings.fontScaleHelpTouch')}
                </span>
              </div>
            )}

            {caps.folders && (
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
            )}
          </div>

          {caps.folders && (
            <div
              className="tk-panel ql-transition-in"
              style={{ '--ql-i': 1 } as React.CSSProperties}
            >
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
          )}

          {caps.updater && (
            <div
              className="tk-panel ql-transition-in"
              style={{ '--ql-i': 2 } as React.CSSProperties}
            >
              <h3 className="tk-h3 tk-h3-rule">{t('settings.updates')}</h3>
              <p className="tk-hint">
                {t(caps.settingsFile ? 'settings.updatesHelp' : 'settings.updatesHelpAndroid')}
              </p>
              {caps.settingsFile && (
                <div className="tk-field">
                  <span className="tk-label">{t('settings.autoUpdate')}</span>
                  <div
                    className="ql-segment"
                    role="radiogroup"
                    aria-label={t('settings.autoUpdate')}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={settings.autoUpdate}
                      className={`tk-btn ${settings.autoUpdate ? 'tk-btn-primary' : 'tk-btn-ghost'} ql-btn-sm`}
                      onClick={() => apply({ autoUpdate: true })}
                    >
                      {t('settings.autoUpdate.on')}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!settings.autoUpdate}
                      className={`tk-btn ${settings.autoUpdate ? 'tk-btn-ghost' : 'tk-btn-primary'} ql-btn-sm`}
                      onClick={() => apply({ autoUpdate: false })}
                    >
                      {t('settings.autoUpdate.off')}
                    </button>
                  </div>
                  <span className="tk-hint">{t('settings.autoUpdateHelp')}</span>
                </div>
              )}
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
                {(up.state === 'notice' || up.state === 'available') && (
                  <button
                    type="button"
                    className="tk-btn tk-btn-primary ql-btn-sm"
                    onClick={() =>
                      up.state === 'notice'
                        ? window.quizloop.update.open()
                        : window.quizloop.update.download(true)
                    }
                  >
                    {t('update.now')}
                  </button>
                )}
                {upLine() && (
                  <span className={`ql-up-note ql-up-${up.state}`} role="status">
                    {upLine()}
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            className="tk-panel ql-transition-in ql-about"
            style={{ '--ql-i': 3 } as React.CSSProperties}
          >
            <h3 className="tk-h3 tk-h3-rule">{t('settings.about')}</h3>
            <p className="tk-hint">
              {info ? t('settings.version', { version: info.version }) : t('common.loading')}
            </p>
            <p className="tk-hint">{t('settings.license')}</p>
            <div className="ql-row">
              <span className="tk-hint">{t('settings.source')}</span>
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm tk-mono"
                title={SOURCE_URL}
                onClick={() => window.quizloop.app.openSource()}
              >
                {t('settings.sourceOpen')}
              </button>
            </div>
            <div className="ql-row">
              <span className="tk-hint">{t('settings.samples')}</span>
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm"
                disabled={busy}
                title={busy ? t('common.loading') : t('library.installSampleHelp')}
                onClick={() => setSampling(true)}
              >
                {t('library.installSample')}
              </button>
            </div>
            <div className="ql-row">
              <span className="tk-hint">{t('settings.welcome')}</span>
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm"
                onClick={() => useApp.getState().showHelp(true)}
              >
                {t('settings.welcomeOpen')}
              </button>
            </div>
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

      {sampling && (
        <Confirm
          title={t('library.installSampleTitle')}
          text={t('library.installSampleConfirm')}
          yes={t('library.installSampleYes')}
          onNo={() => setSampling(false)}
          onYes={installSamples}
        />
      )}

      {importing && (
        <Confirm
          title={t('settings.transferConfirmTitle')}
          text={t('settings.transferConfirm')}
          danger
          onNo={() => setImporting(false)}
          onYes={importPkg}
        />
      )}
    </section>
  )
}
