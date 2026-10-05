import type { GOAL_DAYS, ModuleSummary } from '@shared/ipc'
import { t } from './i18n'

export function goalLabel(m: ModuleSummary): string {
  return m.goal
    ? t('library.goalSet', {
        span: t(`library.goal.${m.goal.days as (typeof GOAL_DAYS)[number]}`)
      })
    : t('library.goal')
}
