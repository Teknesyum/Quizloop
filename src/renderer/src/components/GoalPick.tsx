import { GOAL_DAYS, type ModuleSummary } from '@shared/ipc'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

function untilOf(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

async function setGoal(m: ModuleSummary, days: number | null): Promise<void> {
  const app = useApp.getState()
  const goals = { ...(app.settings?.goals ?? {}) }
  if (days === null) delete goals[m.id]
  else goals[m.id] = { days, until: untilOf(days) }
  await app.saveSettings({ goals })
  await app.loadModules()
  const daily = useApp.getState().modules?.find((x) => x.id === m.id)?.goal?.daily
  app.toast('success', daily ? t('library.goalDone', { daily }) : t('library.goalCleared'))
}

export function GoalPick({ m }: { m: ModuleSummary }): React.JSX.Element {
  const open = m.unseen + m.dueToday + m.learning + m.retiredToday
  return (
    <div className="ql-goal-pick ql-transition-in" role="group" aria-label={t('goals.pick')}>
      {GOAL_DAYS.map((d) => {
        const on = m.goal?.days === d
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            title={t(on ? 'library.goalClear' : 'goals.pick')}
            className={`tk-btn ${on ? 'tk-btn-primary' : 'tk-btn-ghost'} ql-goal-opt`}
            onClick={() => setGoal(m, on ? null : d)}
          >
            <span>{t(`library.goal.${d}`)}</span>
            <span className="tk-mono ql-goal-opt-daily">
              {t('goals.perDay', { daily: Math.ceil(open / d) })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
