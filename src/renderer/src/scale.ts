import { FONT_SCALES } from '@shared/ipc'

export function nextScale(scale: number, dir: number): number {
  const i = FONT_SCALES.indexOf(scale as (typeof FONT_SCALES)[number])
  const at = i === -1 ? FONT_SCALES.indexOf(1) : i
  return FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, at + dir))] ?? 1
}
