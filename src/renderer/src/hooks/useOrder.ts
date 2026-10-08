import { moved } from '@shared/order'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

export function useOrder(key: string): {
  order: string[] | undefined
  move(ids: string[], id: string, step: -1 | 1): void
} {
  const order = useApp((s) => s.settings?.order?.[key])
  const move = (ids: string[], id: string, step: -1 | 1): void => {
    const app = useApp.getState()
    const all = app.settings?.order ?? {}
    app
      .saveSettings({ order: { ...all, [key]: moved(ids, id, step) } })
      .catch((e: unknown) => app.toast('danger', `${t('common.error')}: ${String(e)}`))
  }
  return { order, move }
}
