import { useEffect, useState } from 'react'
import type { InstallResult, ModuleSummary } from '@shared/ipc'
import { Confirm } from '@renderer/components/Confirm'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

function ModuleCard({
  m,
  index,
  onRemove
}: {
  m: ModuleSummary
  index: number
  onRemove(): void
}): React.JSX.Element {
  const go = useApp((s) => s.go)
  return (
    <article
      className="tk-panel ql-card ql-transition-in"
      style={{ '--ql-i': index } as React.CSSProperties}
    >
      <header className="ql-card-head">
        <h3 className="tk-h3">{m.name}</h3>
        <span className="tk-mono ql-card-version">v{m.version}</span>
      </header>
      <dl className="ql-card-stats">
        <div className={m.dueToday ? 'ql-stat-hot' : ''}>
          <dt className="tk-hint">{t('library.card.due', { count: m.dueToday })}</dt>
        </div>
        <div>
          <dt className="tk-hint">{t('library.card.unseen', { count: m.unseen })}</dt>
        </div>
        <div>
          <dt className="tk-hint">{t('library.card.learning', { count: m.learning })}</dt>
        </div>
        <div>
          <dt className="tk-hint">{t('library.card.retired', { count: m.retired })}</dt>
        </div>
      </dl>
      <div
        className="ql-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={m.questionCount}
        aria-valuenow={m.retired}
      >
        <span style={{ width: `${m.questionCount ? (m.retired / m.questionCount) * 100 : 0}%` }} />
      </div>
      <footer className="ql-card-foot">
        <span className="tk-hint">{t('library.card.questions', { count: m.questionCount })}</span>
        <div className="ql-card-actions">
          <button type="button" className="tk-btn tk-btn-ghost ql-btn-sm" onClick={onRemove}>
            {t('library.remove')}
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
  const toast = useApp((s) => s.toast)
  const [removing, setRemoving] = useState<ModuleSummary | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const report = async (r: InstallResult | null): Promise<void> => {
    if (!r) return
    if (r.ok) {
      const list = await window.quizloop.module.list()
      const m = list.find((x) => x.id === r.moduleId)
      toast(
        'success',
        t('library.installed', { name: m?.name ?? r.moduleId ?? '', count: m?.questionCount ?? 0 })
      )
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
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
            onClick={() => run(() => window.quizloop.module.installSample())}
          >
            {t('library.installSample')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-primary"
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
            onClick={() => run(() => window.quizloop.module.pick())}
          >
            {t('library.addFolder')}
          </button>
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
          <h3 className="tk-h3">{t('library.empty.title')}</h3>
          <p className="tk-prose">{t('library.empty.body')}</p>
          <p className="tk-hint">{t('library.dropHint')}</p>
        </div>
      )}

      {modules !== null && modules.length > 0 && (
        <div className="ql-grid">
          {modules.map((m, i) => (
            <ModuleCard key={m.id} m={m} index={i} onRemove={() => setRemoving(m)} />
          ))}
        </div>
      )}

      {dragging && <div className="ql-drop-veil tk-label">{t('library.dropHint')}</div>}

      {removing && (
        <Confirm
          text={t('library.removeConfirm', { name: removing.name })}
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
