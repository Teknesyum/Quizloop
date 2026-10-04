import type { Settings } from '@shared/ipc'
import { z } from 'zod'

export const DEFAULT_SETTINGS: Settings = {
  dayStartHour: 4,
  modulesDir: null,
  typerSpeed: 'normal',
  sessionLimit: 40,
  soundOn: false,
  fontScale: 1,
  blinkSeconds: 5,
  autoUpdate: true,
  welcomeSeen: false,
  samplesUsed: false
}

export const SettingsPatch = z
  .object({
    dayStartHour: z.number().int().min(0).max(23),
    modulesDir: z.string().nullable(),
    typerSpeed: z.enum(['slow', 'normal', 'fast', 'off']),
    sessionLimit: z.number().int().min(5).max(200),
    soundOn: z.boolean(),
    fontScale: z.number().min(0.5).max(2),
    blinkSeconds: z.number().int().min(0).max(30),
    autoUpdate: z.boolean(),
    welcomeSeen: z.boolean(),
    samplesUsed: z.boolean()
  })
  .partial()

export function dayStart(now: Date, hour: number): Date {
  const d = new Date(now)
  d.setHours(hour, 0, 0, 0)
  if (d > now) d.setDate(d.getDate() - 1)
  return d
}
