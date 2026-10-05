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
  retired
}: {
  total: number
  retired: number
}): React.JSX.Element {
  const percent = total ? Math.round((retired / total) * 100) : 0
  return (
    <div className="ql-card-meter" title={t('library.card.retiredHelp')}>
      <p className="ql-card-meter-row">
        <span className="tk-hint">{t('library.card.questions', { count: total })}</span>
        <span className="tk-hint">{t('library.card.percent', { percent })}</span>
      </p>
      <div
        className="ql-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={retired}
      >
        <span style={{ width: `${total ? (retired / total) * 100 : 0}%` }} />
      </div>
    </div>
  )
}
