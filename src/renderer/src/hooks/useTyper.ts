import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Settings } from '@shared/ipc'

const MS_PER_CHAR: Record<Settings['typerSpeed'], number> = {
  slow: 28,
  normal: 14,
  fast: 6,
  off: 0
}

const HIDDEN = 'ql-hidden'
const MAX_MS = 800

function textNodes(root: HTMLElement): Text[] {
  const out: Text[] = []
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest('.katex-mathml') || !n.textContent
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
  })
  while (walk.nextNode()) out.push(walk.currentNode as Text)
  return out
}

function hide(nodes: Text[], from: number): void {
  let left = from
  for (const n of nodes) {
    if (left < n.length) {
      const last = nodes[nodes.length - 1]!
      const r = new Range()
      r.setStart(n, left)
      r.setEnd(last, last.length)
      CSS.highlights.set(HIDDEN, new Highlight(r))
      return
    }
    left -= n.length
  }
  CSS.highlights.delete(HIDDEN)
}

export function useTyper(
  ref: RefObject<HTMLElement | null>,
  speed: Settings['typerSpeed']
): { done: boolean; skip(): void } {
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const perChar = reduced ? 0 : MS_PER_CHAR[speed]
  const webkit =
    typeof navigator !== 'undefined' &&
    /AppleWebKit/.test(navigator.userAgent) &&
    !navigator.userAgent.includes('Chrome/')
  const supported = typeof CSS !== 'undefined' && 'highlights' in CSS && !webkit
  const [done, setDone] = useState(perChar === 0 || !supported)
  const raf = useRef(0)

  useEffect(() => {
    const root = ref.current
    if (done || !root) return
    if (document.visibilityState === 'hidden') {
      const id = window.setTimeout(() => setDone(true), 0)
      return () => window.clearTimeout(id)
    }
    const nodes = textNodes(root)
    const total = nodes.reduce((s, n) => s + n.length, 0)
    hide(nodes, 0)
    const step = Math.min(perChar, MAX_MS / Math.max(1, total))
    let started = -1
    const tick = (now: number): void => {
      if (started < 0) started = now
      const n = Math.max(0, Math.floor((now - started) / step))
      if (n >= total) {
        CSS.highlights.delete(HIDDEN)
        setDone(true)
        return
      }
      hide(nodes, n)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf.current)
      CSS.highlights.delete(HIDDEN)
    }
  }, [ref, perChar, done])

  return {
    done,
    skip: () => {
      cancelAnimationFrame(raf.current)
      if (supported) CSS.highlights.delete(HIDDEN)
      setDone(true)
    }
  }
}
