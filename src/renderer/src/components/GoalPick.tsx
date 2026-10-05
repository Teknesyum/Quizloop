import { GOAL_DAYS, type ModuleSummary } from '@shared/ipc'
import { goalToast, saveGoal } from '@renderer/goal'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

async function setGoal(m: ModuleSummary, days: number | null): Promise<void> {
  await saveGoal(m.id, days)
  await useApp.getState().loadModules()
  goalToast(useApp.getState().modules?.find((x) => x.id === m.id)?.goal?.daily)
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
