import { GOAL_DAYS, type GoalSetting, type ModuleGoal } from '@shared/ipc'
import { t } from './i18n'
import { useApp } from './store/app'

const DAY_MS = 86_400_000

export type GoalSpec = { days: number } | { perDay: number }

export const MAX_DAYS = 3650
export const MAX_PER_DAY = 5000

export function spanText(days: number): string {
  if ((GOAL_DAYS as readonly number[]).includes(days))
    return t(`library.goal.${days as (typeof GOAL_DAYS)[number]}`)
  return days % 7 === 0 ? t('goals.weeks', { n: days / 7 }) : t('goals.days', { n: days })
}

export function goalLabel(m: { goal: ModuleGoal | null }): string {
  if (!m.goal) return t('library.goal')
  return t('library.goalSet', {
    span: m.goal.perDay ? t('goals.perDayShort', { daily: m.goal.daily }) : spanText(m.goal.days)
  })
}

function setting(spec: GoalSpec): GoalSetting {
  const days = 'days' in spec ? spec.days : 1
  const until = new Date(Date.now() + days * DAY_MS).toISOString()
  return 'days' in spec ? { days, until } : { days, until, perDay: spec.perDay }
}

export async function saveGoal(key: string, spec: GoalSpec | null): Promise<void> {
  const app = useApp.getState()
  const goals = { ...(app.settings?.goals ?? {}) }
  if (spec === null) delete goals[key]
  else goals[key] = setting(spec)
  await app.saveSettings({ goals })
}

export async function dropGoals(moduleIds: string[]): Promise<void> {
  const app = useApp.getState()
  const goals = { ...(app.settings?.goals ?? {}) }
  for (const key of Object.keys(goals))
    if (moduleIds.some((id) => key === id || key.startsWith(`${id}/`))) delete goals[key]
  await app.saveSettings({ goals })
}

export function goalToast(daily: number | undefined): void {
  useApp
    .getState()
    .toast('success', daily ? t('library.goalDone', { daily }) : t('library.goalCleared'))
}
