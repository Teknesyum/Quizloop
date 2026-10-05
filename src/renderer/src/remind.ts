import type { ModuleSummary, Reminder } from '@shared/ipc'
import { t } from './i18n'

const KEY = 'ql-goal-remind'
const HOUR = 19
const DAY_MS = 86_400_000

export function canNotify(): boolean {
  return Boolean(window.quizloop.notify) || typeof Notification !== 'undefined'
}

export async function askNotify(): Promise<boolean> {
  const native = window.quizloop.notify
  if (native) return native.ask()
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  return (await Notification.requestPermission()) === 'granted'
}

export function forget(): void {
  void window.quizloop.notify?.plan([])
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
  const open = modules.filter((m) => m.goal && m.retiredToday < m.goal.daily)
  const done = modules.reduce((n, m) => n + (m.goal ? m.retiredToday : 0), 0)
  const daily = modules.reduce((n, m) => n + (m.goal?.daily ?? 0), 0)
  const title = t('goals.notifyTitle')
  const body = t('goals.notifyBody', { done, daily })
  const at = new Date()
  const native = window.quizloop.notify
  if (native) {
    const items: Reminder[] = []
    const evening = new Date(at.getFullYear(), at.getMonth(), at.getDate(), HOUR).getTime()
    if (now) items.push({ id: 3, at: at.getTime() + 2000, title, body })
    if (open.length && at.getTime() < evening) items.push({ id: 1, at: evening, title, body })
    if (daily > 0)
      items.push({
        id: 2,
        at: evening + DAY_MS,
        title,
        body: t('goals.notifyNext', { daily })
      })
    void native.plan(items)
    return
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (now) {
    show(body)
    return
  }
  const day = at.toDateString()
  if (!open.length || at.getHours() < HOUR || seen(day)) return
  keep(day)
  show(body)
}
