import { useEffect, useState } from 'react'
import { tinykeys } from 'tinykeys'
import type { InstallResult, ModuleSummary } from '@shared/ipc'
import { CardCover } from '@renderer/components/CardCover'
import { CardMenu, MenuItem } from '@renderer/components/CardMenu'
import { Confirm } from '@renderer/components/Confirm'
import { Skeleton } from '@renderer/components/Skeleton'
import { ViewToggle } from '@renderer/components/ViewToggle'
import { installedText, t, title } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { useView } from '@renderer/view'

function ModuleCard({
  m,
  index,
  active,
  onFocus,
  onRemove,
  onReset,
  onUpdate
}: {
  m: ModuleSummary
  index: number
  active: boolean
  onFocus(): void
  onRemove(): void
  onReset(): void
  onUpdate(): void
}): React.JSX.Element {
  const go = useApp((s) => s.go)
  const percent = m.questionCount ? Math.round((m.retired / m.questionCount) * 100) : 0
  return (
    <article
      id={`ql-module-${index}`}
      tabIndex={active ? 0 : -1}
      aria-label={m.name}
      onFocus={onFocus}
      className={`tk-panel ql-card ql-transition-in ${active ? 'ql-card-active' : ''}`}
      style={{ '--ql-i': index } as React.CSSProperties}
    >
      <header className="ql-card-head">
        <h3 className="tk-h3" title={m.name}>
          {m.name}
        </h3>
        <span className="tk-mono ql-percent">{percent}%</span>
      </header>
      <div className="ql-card-body">
        <CardCover src={`${m.assetBase}assets/kapak.webp`} name={m.name} />
        <div className="ql-card-info">
          <p className="tk-hint ql-card-tags" aria-label={t('library.tags')}>
            {[
              t('library.card.version', { version: m.version }),
              ...m.tags.map((tag) => title(tag))
            ].join(' · ')}
          </p>
          <p className={`ql-card-due ${m.dueToday ? 'ql-stat-hot' : ''}`}>
            <span className="tk-mono ql-due-count">{m.dueToday}</span>
            <span className="tk-hint">{t('library.card.dueLabel')}</span>
          </p>
          <p className="tk-hint ql-card-rest">
            {t('library.card.unseen', { count: m.unseen })} ·{' '}
            {t('library.card.learning', { count: m.learning })}
          </p>
          <div className="ql-card-meter">
            <p className="ql-card-meter-row">
              <span className="tk-hint">
                {t('library.card.questions', { count: m.questionCount })}
              </span>
              <span className="tk-hint">{t('library.card.percent', { percent })}</span>
            </p>
            <div
              className="ql-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={m.questionCount}
              aria-valuenow={m.retired}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>
      <footer className="ql-card-foot">
        <CardMenu label={t('library.more')}>
          <MenuItem onPick={() => go({ name: 'bank', moduleId: m.id })}>
            {t('library.bank')}
          </MenuItem>
          <MenuItem onPick={onUpdate}>{t('library.update')}</MenuItem>
          <MenuItem onPick={onReset}>{t('library.reset')}</MenuItem>
          <MenuItem danger onPick={onRemove}>
            {t('library.remove')}
          </MenuItem>
        </CardMenu>
        <div className="ql-card-actions">
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={() => go({ name: 'session', moduleId: m.id, chapter: null })}
          >
            {t('library.mixed')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-primary ql-btn-sm"
            onClick={() => go({ name: 'chapters', moduleId: m.id })}
          >
            {t('library.start')}
          </button>
        </div>
      </footer>
    </article>
  )
}

export function Library(): React.JSX.Element {
  const modules = useApp((s) => s.modules)
  const loadModules = useApp((s) => s.loadModules)
  const samplesUsed = useApp((s) => s.settings?.samplesUsed ?? false)
  const toast = useApp((s) => s.toast)
  const [removing, setRemoving] = useState<ModuleSummary | null>(null)
  const [resetting, setResetting] = useState<ModuleSummary | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  const [view, setView] = useView()
  const go = useApp((s) => s.go)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  useEffect(() => {
    if (!modules?.length || removing || resetting) return
    const count = modules.length
    const focus = (i: number): void => {
      const next = (i + count) % count
      setActive(next)
      document.getElementById(`ql-module-${next}`)?.focus()
    }
    const inField = (e: KeyboardEvent): boolean =>
      e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
    const step = (d: number) => (e: KeyboardEvent) => {
      if (inField(e)) return
      e.preventDefault()
      focus(active + d)
    }
    return tinykeys(window, {
      ArrowDown: step(1),
      ArrowRight: step(1),
      ArrowUp: step(-1),
      ArrowLeft: step(-1),
      Enter: (e) => {
        if (inField(e) || (e.target as HTMLElement).closest('button')) return
        const m = modules[active]
        if (!m) return
        e.preventDefault()
        go({ name: 'chapters', moduleId: m.id })
      }
    })
  }, [modules, active, removing, resetting, go])

  const report = async (r: InstallResult | null): Promise<void> => {
    if (!r || r.cancelled) return
    if (r.ok) {
      toast('success', installedText(r))
    } else {
      toast('danger', `${t('library.installFailed')}: ${r.error ?? ''}`)
    }
    await loadModules()
  }

  const run = async (job: () => Promise<InstallResult | null>): Promise<void> => {
    setBusy(true)
    try {
      await report(await job())
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (!f) return
    const path = window.quizloop.pathOf(f)
    if (path) run(() => window.quizloop.module.install(path))
  }

  return (
    <section
      className={`ql-screen ${dragging ? 'ql-dropping' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('library.title')}</h2>
          <p className="tk-hint">{t('library.subtitle')}</p>
        </div>
        <div className="ql-head-actions">
          <button
            type="button"
            className="tk-btn tk-btn-ghost"
            onClick={() => useApp.getState().showHelp(true)}
          >
            {t('welcome.open')}
          </button>
          {(!samplesUsed || modules?.length === 0) && (
            <button
              type="button"
              className="tk-btn tk-btn-ghost"
              disabled={busy}
              title={busy ? t('common.loading') : t('library.installSampleHelp')}
              onClick={async () => {
                await run(() => window.quizloop.module.installSample())
                await useApp.getState().saveSettings({ samplesUsed: true })
              }}
            >
              {t('library.installSample')}
            </button>
          )}
          {window.quizloop.capabilities.folders && (
            <>
              <button
                type="button"
                className="tk-btn tk-btn-ghost"
                disabled={busy}
                title={busy ? t('common.loading') : t('library.addFolderHelp')}
                onClick={() => run(() => window.quizloop.module.pick('folder'))}
              >
                {t('library.addFolder')}
              </button>
              <button
                type="button"
                className="tk-btn tk-btn-primary"
                disabled={busy}
                title={busy ? t('common.loading') : t('library.addFileHelp')}
                onClick={() => run(() => window.quizloop.module.pick('file'))}
              >
                {t('library.addFile')}
              </button>
            </>
          )}
          {window.quizloop.capabilities.packageImport && (
            <button
              type="button"
              className="tk-btn tk-btn-primary"
              disabled={busy}
              title={busy ? t('common.loading') : t('library.addFileHelp')}
              onClick={() => run(() => window.quizloop.module.pick('file'))}
            >
              {t('library.importPackage')}
            </button>
          )}
        </div>
      </header>

      {modules === null && (
        <div className="ql-grid">
          <div className="tk-panel">
            <Skeleton lines={4} />
          </div>
          <div className="tk-panel">
            <Skeleton lines={4} />
          </div>
        </div>
      )}

      {modules !== null && modules.length === 0 && (
        <div className="tk-panel ql-empty ql-transition-in">
          <h3 className="tk-h3">
            <span>{t('library.empty.title')}</span>
          </h3>
          <p className="tk-prose">
            {t(
              window.quizloop.capabilities.packageImport
                ? 'library.empty.bodyPackage'
                : 'library.empty.body'
            )}
          </p>
          {window.quizloop.capabilities.folders && (
            <p className="tk-hint">{t('library.dropHint')}</p>
          )}
        </div>
      )}

      {modules !== null && modules.length > 0 && <ViewToggle view={view} onChange={setView} />}

      {modules !== null && modules.length > 0 && (
        <div className={`ql-grid ${view === 'list' ? 'ql-grid-list' : ''}`}>
          {modules.map((m, i) => (
            <ModuleCard
              key={m.id}
              m={m}
              index={i}
              active={i === active}
              onFocus={() => setActive(i)}
              onRemove={() => setRemoving(m)}
              onReset={() => setResetting(m)}
              onUpdate={() => run(() => window.quizloop.module.pick('file'))}
            />
          ))}
        </div>
      )}

      {modules !== null && modules.length > 0 && (
        <p className="tk-hint ql-keys">{t('library.keys')}</p>
      )}

      {dragging && <div className="ql-drop-veil tk-label">{t('library.dropHint')}</div>}

      {resetting && (
        <Confirm
          title={t('library.resetConfirmTitle', { name: resetting.name })}
          text={t('library.resetConfirm')}
          yes={t('library.reset')}
          danger
          onNo={() => setResetting(null)}
          onYes={async () => {
            await window.quizloop.module.reset(resetting.id)
            setResetting(null)
            await loadModules()
            toast('success', t('library.resetDone'))
          }}
        />
      )}

      {removing && (
        <Confirm
          title={t('library.removeConfirmTitle', { name: removing.name })}
          text={t('library.removeConfirm')}
          yes={t('library.remove')}
          danger
          onNo={() => setRemoving(null)}
          onYes={async () => {
            await window.quizloop.module.remove(removing.id)
            setRemoving(null)
            await loadModules()
          }}
        />
      )}
    </section>
  )
}
