import { lang } from './i18n'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000_000],
  ['month', 2_592_000_000],
  ['week', 604_800_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000]
]

export function ago(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now
  const fmt = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  for (const [unit, ms] of UNITS)
    if (Math.abs(diff) >= ms) return fmt.format(Math.round(diff / ms), unit)
  return fmt.format(0, 'minute')
}
