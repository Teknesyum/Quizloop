import { useEffect, type RefObject } from 'react'
import { pushBack } from '@renderer/back'

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select, textarea, a[href], [tabindex]:not([tabindex="-1"])'

export function useLayer(ref: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(
    () =>
      pushBack(() => {
        onClose()
        return true
      }),
    [onClose]
  )

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      const panel = ref.current
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || !panel.contains(at))) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && (at === last || !panel.contains(at))) {
        e.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [ref])
}
