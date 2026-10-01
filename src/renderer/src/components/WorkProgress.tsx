import { useEffect, useId, useState } from 'react'
import type { WorkProgress as Progress } from '@shared/ipc'
import { t, type Key } from '@renderer/i18n'
import { ProgressBar } from './ProgressBar'

function settleMs(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--tk-t-slow').trim()
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return 0
  return (raw.endsWith('ms') ? n : n * 1000) * 2
}

function stepText(p: Progress): string {
  return t(`work.step.${p.step}` as Key, { done: p.done, total: p.total })
}

export function WorkProgress(): React.JSX.Element | null {
  const [p, setP] = useState<Progress | null>(null)
  const id = useId()

  useEffect(() => window.quizloop.work.onProgress(setP), [])

  useEffect(() => {
    if (!p || p.status === 'running') return
    const h = window.setTimeout(() => setP(null), settleMs())
    return () => window.clearTimeout(h)
  }, [p])

  if (!p) return null
  return (
    <div className="tk-modal-scrim" data-tk-modal="work" role="presentation">
      <div
        className="tk-panel tk-modal ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        aria-busy={p.status === 'running'}
      >
        <p className="tk-h3" id={id}>
          {t(`work.task.${p.task}` as Key)}
        </p>
        <ProgressBar
          percent={p.percent}
          step={stepText(p)}
          status={p.status}
          label={t(`work.task.${p.task}` as Key)}
        />
      </div>
    </div>
  )
}
