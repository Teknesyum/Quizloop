import type { ModuleGoal } from '@shared/ipc'
import { t } from '@renderer/i18n'

interface Counts {
  dueToday: number
  unseen: number
  learning: number
  retiredToday: number
}

export function CardInfo({
  tags,
  c,
  goal
}: {
  tags?: string
  c: Counts
  goal?: ModuleGoal | null
}): React.JSX.Element {
  return (
    <div className="ql-card-info">
      {tags && (
        <p className="tk-hint ql-card-tags" aria-label={t('library.tags')} title={tags}>
          {tags}
        </p>
      )}
      <p
        className={`ql-card-line ${c.dueToday ? 'ql-stat-hot' : 'tk-hint'}`}
        title={t('library.card.dueHelp')}
      >
        {t('library.card.due', { count: c.dueToday })}
      </p>
      <p className="tk-hint ql-card-line ql-card-rest" title={t('library.card.restHelp')}>
        {t('library.card.unseen', { count: c.unseen })}
      </p>
      <p className="tk-hint ql-card-line ql-card-rest" title={t('library.card.restHelp')}>
        {t('library.card.learning', { count: c.learning })}
      </p>
      {goal && (
        <p
          className={`ql-card-line ql-card-goal ${c.retiredToday >= goal.daily ? 'ql-goal-met' : ''}`}
          title={t('library.card.goalHelp', { days: goal.daysLeft })}
        >
          {t('library.card.goal', { done: c.retiredToday, daily: goal.daily })}
        </p>
      )}
    </div>
  )
}

export function CardMeter({
  total,
  retired,
  partial
}: {
  total: number
  retired: number
  partial: number
}): React.JSX.Element {
  const percent = total ? Math.round((retired / total) * 100) : 0
  return (
    <div className="ql-card-meter" title={t('library.card.retiredHelp')}>
      <p className="ql-card-meter-row">
        <span className="tk-hint">
          {t('library.card.questions', { count: total })} · {t('goals.percent', { percent })}
        </span>
        <span className="tk-hint">{t('library.card.split', { retired, partial })}</span>
      </p>
      <div
        className="ql-progress"
        role="progressbar"
        aria-label={t('library.card.retiredHelp')}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={retired}
      >
        <span style={{ width: `${total ? (retired / total) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

export function GoalMeter({ done, goal }: { done: number; goal: ModuleGoal }): React.JSX.Element {
  const met = done >= goal.daily
  const part = goal.daily ? Math.min(1, done / goal.daily) : 0
  return (
    <div className="ql-card-meter" title={t('library.card.goalHelp', { days: goal.daysLeft })}>
      <p className={`ql-card-meter-row ${met ? 'ql-goal-met' : ''}`}>
        <span className="tk-hint">{t('library.card.goal', { done, daily: goal.daily })}</span>
        <span className="tk-hint">{t('goals.percent', { percent: Math.round(part * 100) })}</span>
      </p>
      <div
        className="ql-progress ql-goal-bar"
        role="progressbar"
        aria-label={t('goals.today')}
        aria-valuemin={0}
        aria-valuemax={goal.daily}
        aria-valuenow={Math.min(done, goal.daily)}
      >
        <span style={{ width: `${part * 100}%` }} />
      </div>
    </div>
  )
}
