import type { GoalSetting, ModuleGoal, Settings } from '@shared/ipc'
import { z } from 'zod'

export const DEFAULT_SETTINGS: Settings = {
  dayStartHour: 4,
  modulesDir: null,
  typerSpeed: 'normal',
  sessionLimit: 40,
  soundOn: false,
  fontScale: 1,
  autoUpdate: true,
  bookAuto: false,
  welcomeSeen: false,
  newsSeen: '',
  samplesUsed: false,
  goals: {},
  goalNotify: false,
  theme: 'Teknesyum',
  order: {},
  catalogs: []
}

export const SettingsPatch = z
  .object({
    dayStartHour: z.number().int().min(0).max(23),
    modulesDir: z.string().nullable(),
    typerSpeed: z.enum(['slow', 'normal', 'fast', 'off']),
    sessionLimit: z.number().int().min(5).max(200),
    soundOn: z.boolean(),
    fontScale: z.number().min(0.5).max(2),
    autoUpdate: z.boolean(),
    bookAuto: z.boolean(),
    welcomeSeen: z.boolean(),
    newsSeen: z.string().max(20),
    samplesUsed: z.boolean(),
    goals: z.record(
      z.string(),
      z.object({
        days: z.number().int().min(1).max(3650),
        until: z.string(),
        perDay: z.number().int().min(1).max(5000).optional()
      })
    ),
    goalNotify: z.boolean(),
    theme: z.string().min(1).max(40),
    order: z.record(z.string(), z.array(z.string()).max(5000)),
    catalogs: z
      .array(
        z.object({
          url: z.string().min(1).max(2000),
          name: z.string().max(120),
          publisher: z.string().max(120),
          channels: z.array(z.string().max(64)).max(500)
        })
      )
      .max(50)
  })
  .partial()

const DAY_MS = 86_400_000

export function dailyGoal(
  goal: GoalSetting,
  open: number,
  retiredToday: number,
  start: Date
): ModuleGoal {
  if (goal.perDay) {
    const daysLeft = Math.max(1, Math.ceil(open / goal.perDay))
    return {
      days: daysLeft,
      daily: Math.min(goal.perDay, open + retiredToday),
      daysLeft,
      until: new Date(start.getTime() + daysLeft * DAY_MS).toISOString(),
      perDay: true
    }
  }
  const left = Math.floor((new Date(goal.until).getTime() - start.getTime()) / DAY_MS)
  const daysLeft = Number.isFinite(left) ? Math.max(1, left) : 1
  return {
    days: goal.days,
    daily: Math.ceil((open + retiredToday) / daysLeft),
    daysLeft,
    until: goal.until,
    perDay: false
  }
}

export function dayStart(now: Date, hour: number): Date {
  const d = new Date(now)
  d.setHours(hour, 0, 0, 0)
  if (d > now) d.setDate(d.getDate() - 1)
  return d
}
