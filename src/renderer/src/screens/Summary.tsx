import type { SessionSummary } from '@shared/ipc'
import { t } from '@renderer/i18n'

interface Props {
  summary: SessionSummary
  onBack(): void
  onAgain(): void
}

export function Summary({ summary, onBack, onAgain }: Props): React.JSX.Element {
  const rows: [string, number][] = [
    [t('summary.seen'), summary.seen],
    [t('summary.first'), summary.correctFirstTry],
    [t('summary.retired'), summary.retired],
    [t('summary.relearned'), summary.relearned]
  ]
  return (
    <section className="ql-screen ql-session">
      <div className="tk-panel ql-summary ql-transition-in">
        <h2 className="tk-h2">{t('summary.title')}</h2>
        <div className="ql-summary-score">
          <span className="tk-label">{t('summary.score')}</span>
          <span className="tk-hero">{summary.score}</span>
        </div>
        <dl className="ql-summary-grid">
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className="ql-transition-in"
              style={{ '--ql-i': i } as React.CSSProperties}
            >
              <dt className="tk-hint">{label}</dt>
              <dd className="tk-mono">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="tk-modal-actions">
          <button type="button" className="tk-btn tk-btn-ghost" onClick={onBack}>
            {t('summary.back')}
          </button>
          <button type="button" className="tk-btn tk-btn-primary" onClick={onAgain} autoFocus>
            {t('summary.again')}
          </button>
        </div>
      </div>
    </section>
  )
}
