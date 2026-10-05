import { useEffect } from 'react'
import type { ModuleSummary } from '@shared/ipc'
import { CardCover } from '@renderer/components/CardCover'
import { GoalPick } from '@renderer/components/GoalPick'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { askNotify, canNotify, forget, remind } from '@renderer/remind'
import { useApp } from '@renderer/store/app'

const INFO = [
  'goals.info.1',
  'goals.info.2',
  'goals.info.3',
  'goals.info.4',
  'goals.info.5'
] as const

function share(done: number, of: number): string {
  return `${of ? Math.min(100, (done / of) * 100) : 0}%`
}

function GoalRow({ m, index }: { m: ModuleSummary; index: number }): React.JSX.Element {
  const go = useApp((s) => s.go)
  const g = m.goal
  const left = m.unseen + m.dueToday + m.learning
  const met = g ? m.retiredToday >= g.daily : false
  return (
    <article
      className="tk-panel ql-goal ql-transition-in"
      aria-label={m.name}
      style={{ '--ql-i': index } as React.CSSProperties}
    >
      <CardCover src={`${m.assetBase}assets/kapak.webp`} name={m.name} />
      <div className="ql-goal-body">
        <h3 className="tk-h3" title={m.name}>
          {m.name}
        </h3>
        {g ? (
          <>
            <p className={`ql-goal-today ${met ? 'ql-goal-met' : ''}`}>
              <span className="tk-mono ql-goal-count">
                {m.retiredToday}/{g.daily}
              </span>
              <span className="tk-hint">{t(met ? 'goals.met' : 'goals.today')}</span>
            </p>
            <div
              className="ql-progress ql-goal-bar"
              role="progressbar"
              aria-label={t('goals.today')}
              aria-valuemin={0}
              aria-valuemax={g.daily}
              aria-valuenow={Math.min(m.retiredToday, g.daily)}
            >
              <span style={{ width: share(m.retiredToday, g.daily) }} />
            </div>
            <p className="tk-hint ql-goal-line">
              {t('goals.left', {
                days: g.daysLeft,
                date: new Date(g.until).toLocaleDateString(),
                count: left
              })}
            </p>
          </>
        ) : (
          <p className="tk-hint ql-goal-line">{t('goals.none')}</p>
        )}
        <div className="ql-card-meter" title={t('library.card.retiredHelp')}>
          <p className="ql-card-meter-row">
            <span className="tk-hint">
              {t('library.card.questions', { count: m.questionCount })}
            </span>
            <span className="tk-hint">
              {t('library.card.percent', {
                percent: m.questionCount ? Math.round((m.retired / m.questionCount) * 100) : 0
              })}
            </span>
          </p>
          <div
            className="ql-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={m.questionCount}
            aria-valuenow={m.retired}
          >
            <span style={{ width: share(m.retired, m.questionCount) }} />
          </div>
        </div>
        <GoalPick m={m} />
        <footer className="ql-card-foot ql-goal-foot">
          <div className="ql-card-actions">
            <button
              type="button"
              className="tk-btn tk-btn-primary ql-btn-sm"
              onClick={() => go({ name: 'chapters', moduleId: m.id })}
            >
              {t('library.begin')}
            </button>
          </div>
        </footer>
      </div>
    </article>
  )
}

export function Goals(): React.JSX.Element {
  const modules = useApp((s) => s.modules)
  const loadModules = useApp((s) => s.loadModules)
  const notify = useApp((s) => s.settings?.goalNotify ?? false)

  const turnOn = async (): Promise<void> => {
    const app = useApp.getState()
    if (!(await askNotify())) {
      app.toast('warning', t('goals.notifyDenied'))
      return
    }
    await app.saveSettings({ goalNotify: true })
    app.toast('success', t('goals.notifyDone'))
    remind(app.modules ?? [], true)
  }

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const withGoal = modules?.filter((m) => m.goal) ?? []
  const done = withGoal.reduce((n, m) => n + m.retiredToday, 0)
  const daily = withGoal.reduce((n, m) => n + (m.goal?.daily ?? 0), 0)
  const sorted = modules ? [...withGoal, ...modules.filter((m) => !m.goal)] : null

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('goals.title')}</h2>
          <p className="tk-hint">
            {withGoal.length ? t('goals.total', { done, daily }) : t('goals.subtitle')}
          </p>
        </div>
      </header>

      {sorted === null && (
        <div className="tk-panel">
          <Skeleton lines={4} />
        </div>
      )}

      {sorted !== null && sorted.length === 0 && (
        <div className="tk-panel ql-empty ql-transition-in">
          <p className="tk-prose">{t('goals.empty')}</p>
        </div>
      )}

      {sorted !== null && sorted.length > 0 && (
        <div className="tk-panel ql-goal-info ql-transition-in">
          <h3 className="tk-h3">{t('goals.infoTitle')}</h3>
          <ul className="tk-prose">
            {INFO.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </div>
      )}

      {withGoal.length > 0 && (
        <div className="tk-panel ql-goal-notify ql-transition-in">
          <p className="tk-hint">
            {t(!canNotify() ? 'goals.notifyNone' : notify ? 'goals.notifyOn' : 'goals.notifyAsk')}
          </p>
          {canNotify() && !notify && (
            <button type="button" className="tk-btn tk-btn-primary ql-btn-sm" onClick={turnOn}>
              {t('goals.notifyButton')}
            </button>
          )}
          {canNotify() && notify && (
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              onClick={() => {
                forget()
                void useApp.getState().saveSettings({ goalNotify: false })
              }}
            >
              {t('goals.notifyOff')}
            </button>
          )}
        </div>
      )}

      {sorted !== null && sorted.length > 0 && (
        <div className="ql-goals">
          {sorted.map((m, i) => (
            <GoalRow key={m.id} m={m} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
