import type { GOAL_DAYS, ModuleGoal } from '@shared/ipc'
import { t } from './i18n'
import { useApp } from './store/app'

const DAY_MS = 86_400_000

export function goalLabel(m: { goal: ModuleGoal | null }): string {
  return m.goal
    ? t('library.goalSet', {
        span: t(`library.goal.${m.goal.days as (typeof GOAL_DAYS)[number]}`)
      })
    : t('library.goal')
}

export async function saveGoal(key: string, days: number | null): Promise<void> {
  const app = useApp.getState()
  const goals = { ...(app.settings?.goals ?? {}) }
  if (days === null) delete goals[key]
  else goals[key] = { days, until: new Date(Date.now() + days * DAY_MS).toISOString() }
  await app.saveSettings({ goals })
}

export function goalToast(daily: number | undefined): void {
  useApp
    .getState()
    .toast('success', daily ? t('library.goalDone', { daily }) : t('library.goalCleared'))
}
