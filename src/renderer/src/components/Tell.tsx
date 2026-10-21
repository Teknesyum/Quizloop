import { useEffect, useMemo, useRef, useState } from 'react'
import type { SourceBook } from '@shared/ipc'
import type { SolutionBlock } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { ProgressBar } from './ProgressBar'
import { Solution } from './Solution'
import { tellSteps } from './media'

export function Tell({
  blocks,
  assetBase,
  book
}: {
  blocks: SolutionBlock[]
  assetBase: string
  book: SourceBook | null
}): React.JSX.Element {
  const steps = useMemo(() => tellSteps(blocks), [blocks])
  const [shown, setShown] = useState(1)
  const lastRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (shown > 1) lastRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [shown])

  return (
    <div className="ql-tell-steps">
      {steps.length > 1 && (
        <div className="ql-tell-progress">
          <ProgressBar
            percent={(shown / steps.length) * 100}
            step=""
            status={shown >= steps.length ? 'done' : 'running'}
            label={t('session.explainStep', { n: shown, total: steps.length })}
          />
        </div>
      )}
      <ol className="ql-tell-list">
        {steps.slice(0, shown).map((step, i) => (
          <li
            key={i}
            ref={i === shown - 1 ? lastRef : undefined}
            className="ql-tell-step ql-transition-in"
          >
            <Solution blocks={step} assetBase={assetBase} book={book} />
          </li>
        ))}
      </ol>
      {shown < steps.length && (
        <button
          type="button"
          className="tk-btn tk-btn-primary ql-btn-sm"
          onClick={() => setShown(shown + 1)}
        >
          {t('session.explainNext', { n: shown + 1, total: steps.length })}
        </button>
      )}
    </div>
  )
}
