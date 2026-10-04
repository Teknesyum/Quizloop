import { t } from '@renderer/i18n'
import { nextScale } from '@renderer/scale'

export function ScaleSwitch({
  scale,
  onChange
}: {
  scale: number
  onChange(next: number): void
}): React.JSX.Element {
  const down = nextScale(scale, -1)
  const up = nextScale(scale, 1)
  return (
    <div className="ql-scale" role="group" aria-label={t('scale.label')}>
      <button
        type="button"
        className="ql-scale__btn"
        aria-label={t('scale.down')}
        title={t('scale.down')}
        disabled={down === scale}
        onClick={() => onChange(down)}
      >
        A−
      </button>
      <button
        type="button"
        className="ql-scale__btn tk-mono"
        aria-label={t('scale.reset')}
        title={t('scale.reset')}
        onClick={() => onChange(1)}
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        type="button"
        className="ql-scale__btn"
        aria-label={t('scale.up')}
        title={t('scale.up')}
        disabled={up === scale}
        onClick={() => onChange(up)}
      >
        A+
      </button>
    </div>
  )
}
