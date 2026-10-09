import { useEffect, useMemo, useState } from 'react'
import { tinykeys } from 'tinykeys'
import { SAMPLE_IDS, type InstallResult, type ModuleSummary } from '@shared/ipc'
import { LIBRARY_ORDER, ordered } from '@shared/order'
import { CardCover } from '@renderer/components/CardCover'
import { CardInfo, CardMeter } from '@renderer/components/CardFacts'
import { CardMenu, MenuItem } from '@renderer/components/CardMenu'
import { Confirm } from '@renderer/components/Confirm'
import { GoalDialog } from '@renderer/components/GoalPick'
import { Skeleton } from '@renderer/components/Skeleton'
import { ViewToggle } from '@renderer/components/ViewToggle'
import { useOrder } from '@renderer/hooks/useOrder'
import { dropGoals, goalLabel, goalToast, saveGoal } from '@renderer/goal'
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
  onGoal,
  onMove
}: {
  m: ModuleSummary
  index: number
  active: boolean
  onFocus(): void
  onRemove(): void
  onReset(): void
  onGoal(): void
  onMove: { up?(): void; down?(): void }
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
        <CardInfo
          tags={[
            t('library.card.version', { version: m.version }),
            ...m.tags.map((tag) => title(tag))
          ].join(' · ')}
          c={m}
          goal={m.goal}
        />
      </div>
      <CardMeter total={m.questionCount} retired={m.retired} partial={m.partial} />
      <footer className="ql-card-foot">
        <CardMenu label={t('library.more')}>
          <MenuItem onPick={() => go({ name: 'bank', moduleId: m.id })}>
            {t('library.bank')}
          </MenuItem>
          {onMove.up && <MenuItem onPick={onMove.up}>{t('library.moveUp')}</MenuItem>}
          {onMove.down && <MenuItem onPick={onMove.down}>{t('library.moveDown')}</MenuItem>}
          <MenuItem onPick={onReset}>{t('library.reset')}</MenuItem>
          <MenuItem danger onPick={onRemove}>
            {t('library.remove')}
          </MenuItem>
        </CardMenu>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-sm"
          title={t('library.goalHelp')}
          onClick={onGoal}
        >
          {goalLabel(m)}
        </button>
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
            {t('library.begin')}
          </button>
        </div>
      </footer>
    </article>
  )
}

export function Library(): React.JSX.Element {
  const raw = useApp((s) => s.modules)
  const { order, move } = useOrder(LIBRARY_ORDER)
  const modules = useMemo(() => raw && ordered(raw, (m) => m.id, order), [raw, order])
  const ids = modules?.map((m) => m.id) ?? []
  const loadModules = useApp((s) => s.loadModules)
  const toast = useApp((s) => s.toast)
  const [removing, setRemoving] = useState<ModuleSummary | null>(null)
  const [resetting, setResetting] = useState<ModuleSummary | null>(null)
  const [goaling, setGoaling] = useState<string | null>(null)
  const [sampling, setSampling] = useState<'install' | 'remove' | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  const [view, setView] = useView()
  const go = useApp((s) => s.go)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  useEffect(() => {
    if (!modules?.length || removing || resetting || goaling || sampling) return
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
  }, [modules, active, removing, resetting, goaling, sampling, go])

  const last = raw?.reduce<ModuleSummary | null>(
    (best, m) => (m.used && (!best || m.used > (best.used ?? '')) ? m : best),
    null
  )
  const resume = (): void => {
    if (!last) return
    if (last.retired >= last.questionCount) go({ name: 'chapters', moduleId: last.id })
    else go({ name: 'session', moduleId: last.id, chapter: last.lastChapter })
  }

  const samples = modules?.filter((m) => SAMPLE_IDS.includes(m.id)) ?? []
  const goalOf = goaling ? modules?.find((m) => m.id === goaling) : undefined

  const report = async (r: InstallResult | null): Promise<void> => {
    if (!r || r.cancelled) return
    if (r.ok) {
      useApp.setState((s) => ({ fresh: s.fresh + 1 }))
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
          {modules !== null && samples.length > 0 && (
            <button
              type="button"
              className="tk-btn tk-btn-ghost"
              disabled={busy}
              title={busy ? t('common.loading') : t('library.removeSampleHelp')}
              onClick={() => setSampling('remove')}
            >
              {t('library.removeSample')}
            </button>
          )}
          {modules !== null && samples.length === 0 && (
            <button
              type="button"
              className="tk-btn tk-btn-ghost"
              disabled={busy}
              title={busy ? t('common.loading') : t('library.installSampleHelp')}
              onClick={() => setSampling('install')}
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

      {last && (
        <div className="ql-resume ql-transition-in">
          <button type="button" className="tk-btn tk-btn-primary" onClick={resume} autoFocus>
            {t('library.resume')}
          </button>
          <span className="tk-hint">
            {[last.name, last.lastChapter ?? t('library.resumeMixed')].join(' · ')}
          </span>
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
              onGoal={() => setGoaling(m.id)}
              onMove={{
                up: i > 0 ? () => move(ids, m.id, -1) : undefined,
                down: i < ids.length - 1 ? () => move(ids, m.id, 1) : undefined
              }}
            />
          ))}
        </div>
      )}

      {modules !== null && modules.length > 0 && (
        <p className="tk-hint ql-keys">{t('library.keys')}</p>
      )}

      {dragging && <div className="ql-drop-veil tk-label">{t('library.dropHint')}</div>}

      {goalOf && (
        <GoalDialog
          name={goalOf.name}
          goal={goalOf.goal}
          open={goalOf.unseen + goalOf.dueToday + goalOf.learning + goalOf.retiredToday}
          onClose={() => setGoaling(null)}
          onPick={async (spec) => {
            await saveGoal(goalOf.id, spec)
            setGoaling(null)
            await loadModules()
            goalToast(useApp.getState().modules?.find((x) => x.id === goalOf.id)?.goal?.daily)
          }}
        />
      )}

      {sampling === 'install' && (
        <Confirm
          title={t('library.installSampleTitle')}
          text={t('library.installSampleConfirm')}
          yes={t('library.installSampleYes')}
          onNo={() => setSampling(null)}
          onYes={async () => {
            setSampling(null)
            await run(() => window.quizloop.module.installSample())
            await useApp.getState().saveSettings({ samplesUsed: true })
          }}
        />
      )}

      {sampling === 'remove' && (
        <Confirm
          title={t('library.removeSampleTitle')}
          text={t('library.removeSampleConfirm', {
            names: samples.map((m) => m.name).join(', ')
          })}
          yes={t('library.removeSampleYes')}
          danger
          onNo={() => setSampling(null)}
          onYes={async () => {
            setSampling(null)
            setBusy(true)
            try {
              for (const m of samples) await window.quizloop.module.remove(m.id)
              await dropGoals(samples.map((m) => m.id))
              await useApp.getState().saveSettings({ samplesUsed: true })
              await loadModules()
              toast('success', t('library.removeSampleDone'))
            } finally {
              setBusy(false)
            }
          }}
        />
      )}

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
            await dropGoals([removing.id])
            setRemoving(null)
            await loadModules()
          }}
        />
      )}
    </section>
  )
}
