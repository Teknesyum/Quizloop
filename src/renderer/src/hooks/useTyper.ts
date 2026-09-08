import { useEffect, useRef, useState } from 'react'
import type { Settings } from '@shared/ipc'

const MS_PER_CHAR: Record<Settings['typerSpeed'], number> = {
  slow: 28,
  normal: 14,
  fast: 6,
  off: 0
}

function repair(partial: string): string {
  let out = partial
  const fence = (out.match(/```/g) ?? []).length
  if (fence % 2) out += '\n```'
  const dollar2 = (out.match(/\$\$/g) ?? []).length
  if (dollar2 % 2) out += '$$'
  const single = out.replace(/\$\$/g, '')
  if ((single.match(/\$/g) ?? []).length % 2) out += '$'
  const bold = (out.match(/\*\*/g) ?? []).length
  if (bold % 2) out += '**'
  const tick = (out.replace(/```/g, '').match(/`/g) ?? []).length
  if (tick % 2) out += '`'
  return out
}

export function useTyper(
  text: string,
  speed: Settings['typerSpeed']
): { shown: string; done: boolean; skip(): void } {
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const perChar = reduced ? 0 : MS_PER_CHAR[speed]
  const [count, setCount] = useState(perChar === 0 ? text.length : 0)
  const raf = useRef(0)

  useEffect(() => {
    const started = performance.now()
    const tick = (now: number): void => {
      const n = perChar === 0 ? text.length : Math.floor((now - started) / perChar)
      setCount(Math.min(text.length, n))
      if (n < text.length) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [text, perChar])

  const done = count >= text.length
  return {
    shown: done ? text : repair(text.slice(0, count)),
    done,
    skip: () => {
      cancelAnimationFrame(raf.current)
      setCount(text.length)
    }
  }
}
