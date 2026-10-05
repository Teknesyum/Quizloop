import type { ModuleSummary } from '@shared/ipc'
import { t } from './i18n'

const KEY = 'ql-goal-remind'
const HOUR = 19

export function canNotify(): boolean {
  return typeof Notification !== 'undefined'
}

export async function askNotify(): Promise<boolean> {
  if (!canNotify()) return false
  if (Notification.permission === 'granted') return true
  return (await Notification.requestPermission()) === 'granted'
}

function show(body: string): void {
  const title = t('goals.notifyTitle')
  try {
    new Notification(title, { body })
  } catch {
    navigator.serviceWorker?.ready.then((r) => r.showNotification(title, { body })).catch(() => {})
  }
}

function seen(day: string): boolean {
  try {
    return localStorage.getItem(KEY) === day
  } catch {
    return false
  }
}

function keep(day: string): void {
  try {
    localStorage.setItem(KEY, day)
  } catch {
    return
  }
}

export function remind(modules: ModuleSummary[], now = false): void {
  if (!canNotify() || Notification.permission !== 'granted') return
  const open = modules.filter((m) => m.goal && m.retiredToday < m.goal.daily)
  const done = modules.reduce((n, m) => n + (m.goal ? m.retiredToday : 0), 0)
  const daily = modules.reduce((n, m) => n + (m.goal?.daily ?? 0), 0)
  if (now) {
    show(t('goals.notifyBody', { done, daily }))
    return
  }
  const at = new Date()
  const day = at.toDateString()
  if (!open.length || at.getHours() < HOUR || seen(day)) return
  keep(day)
  show(t('goals.notifyBody', { done, daily }))
}
