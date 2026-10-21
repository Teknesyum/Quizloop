import { useEffect, useState } from 'react'
import type { ModuleSummary, RecentSession } from '@shared/ipc'
import { ProgressBar } from '@renderer/components/ProgressBar'
import { ago } from '@renderer/ago'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

function where(r: RecentSession): string {
  const scope = r.mixed
    ? t('library.resumeMixed')
    : r.chapter === '' || r.chapter === null
      ? t('chapters.unsorted')
      : r.chapter
  return `${r.name} · ${scope}`
}

function GoalLine({ modules }: { modules: ModuleSummary[] }): React.JSX.Element {
  const go = useApp((s) => s.go)
  const withGoal = modules.filter((m) => m.goal)
  if (!withGoal.length)
    return (
      <div className="ql-row ql-recent-goal">
        <span className="tk-hint">{t('library.recent.noGoal')}</span>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-sm"
          onClick={() => go({ name: 'goals' })}
        >
          {t('library.recent.setGoal')}
        </button>
      </div>
    )
  const done = withGoal.reduce((n, m) => n + Math.min(m.retiredToday, m.goal?.daily ?? 0), 0)
  const daily = withGoal.reduce((n, m) => n + (m.goal?.daily ?? 0), 0)
  return (
    <div className="ql-recent-goal">
      <ProgressBar
        percent={daily ? (done / daily) * 100 : 0}
        step={t('library.recent.goal', { done, daily })}
        status={daily && done >= daily ? 'done' : 'running'}
        label={t('goals.today')}
      />
    </div>
  )
}

export function RecentPanel({ fresh }: { fresh: number }): React.JSX.Element | null {
  const go = useApp((s) => s.go)
  const modules = useApp((s) => s.modules)
  const [recent, setRecent] = useState<RecentSession[] | null>(null)

  useEffect(() => {
    let dead = false
    window.quizloop.history.recent(3).then(
      (r) => {
        if (!dead) setRecent(r)
      },
      () => {
        if (!dead) setRecent([])
      }
    )
    return () => {
      dead = true
    }
  }, [fresh])

  if (!modules?.length || recent === null) return null

  return (
    <section className="tk-panel ql-recent ql-transition-in" aria-labelledby="ql-recent-title">
      <header className="ql-recent-head">
        <h3 className="tk-h3" id="ql-recent-title">
          {t('library.recent.title')}
        </h3>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-sm"
          onClick={() => go({ name: 'history' })}
        >
          {t('history.open')}
        </button>
      </header>
      {recent.length === 0 && <p className="tk-hint">{t('library.recent.none')}</p>}
      {recent.length > 0 && (
        <ul className="ql-recent-list">
          {recent.map((r, i) => {
            const percent = r.total ? Math.round((r.retired / r.total) * 100) : 0
            return (
              <li key={r.sessionId}>
                <button
                  type="button"
                  className={`tk-btn ${i === 0 ? 'tk-btn-primary' : 'tk-btn-ghost'} ql-recent-item`}
                  autoFocus={i === 0}
                  onClick={() =>
                    r.total && r.retired >= r.total
                      ? go({ name: 'chapters', moduleId: r.moduleId })
                      : go({
                          name: 'session',
                          moduleId: r.moduleId,
                          chapter: r.mixed ? null : (r.chapter ?? '')
                        })
                  }
                >
                  <span className="ql-recent-where">{where(r)}</span>
                  <span className="ql-recent-meta">
                    <span>{ago(r.endedAt ?? r.startedAt)}</span>
                    <span>
                      {t('library.recent.progress', {
                        seen: r.seen,
                        correct: r.correct,
                        percent
                      })}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <GoalLine modules={modules} />
    </section>
  )
}
