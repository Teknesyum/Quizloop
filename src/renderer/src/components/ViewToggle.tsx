import { t } from '@renderer/i18n'
import type { View } from '@renderer/view'

function Option({
  value,
  view,
  onChange
}: {
  value: View
  view: View
  onChange(v: View): void
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={view === value}
      className={`tk-btn ql-btn-sm ${view === value ? 'tk-btn-primary' : 'tk-btn-ghost'}`}
      onClick={() => onChange(value)}
    >
      {t(value === 'card' ? 'view.card' : 'view.list')}
    </button>
  )
}

export function ViewToggle({
  view,
  onChange
}: {
  view: View
  onChange(v: View): void
}): React.JSX.Element {
  return (
    <div className="ql-segment ql-view-toggle" role="radiogroup" aria-label={t('view.label')}>
      <Option value="card" view={view} onChange={onChange} />
      <Option value="list" view={view} onChange={onChange} />
    </div>
  )
}
