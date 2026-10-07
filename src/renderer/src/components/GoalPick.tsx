import { useEffect, useId, useRef, useState } from 'react'
import { GOAL_DAYS, type ModuleGoal } from '@shared/ipc'
import { MAX_DAYS, MAX_PER_DAY, type GoalSpec } from '@renderer/goal'
import { useLayer } from '@renderer/hooks/useLayer'
import { t } from '@renderer/i18n'

type Mode = 'span' | 'count'
type Unit = 'day' | 'week' | 'month'

const UNIT_DAYS: Record<Unit, number> = { day: 1, week: 7, month: 30 }
const UNITS: Unit[] = ['day', 'week', 'month']

function whole(text: string): number {
  const n = Number(text)
  return Number.isInteger(n) && n > 0 ? n : 0
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: T
  options: { value: T; text: string }[]
  onChange(v: T): void
}): React.JSX.Element {
  return (
    <div className="ql-segment" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`tk-btn ql-btn-sm ${value === o.value ? 'tk-btn-primary' : 'tk-btn-ghost'}`}
          onClick={() => onChange(o.value)}
        >
          {o.text}
        </button>
      ))}
    </div>
  )
}

export function GoalPick({
  goal,
  open,
  onPick
}: {
  goal: ModuleGoal | null
  open: number
  onPick(spec: GoalSpec | null): void
}): React.JSX.Element {
  const id = useId()
  const [mode, setMode] = useState<Mode>(goal?.perDay ? 'count' : 'span')
  const [unit, setUnit] = useState<Unit>('week')
  const [span, setSpan] = useState('')
  const [count, setCount] = useState('')
  const days = whole(span) * UNIT_DAYS[unit]
  const perDay = whole(count)
  const spanOk = days > 0 && days <= MAX_DAYS
  const countOk = perDay > 0 && perDay <= MAX_PER_DAY
  const preset = !goal || goal.perDay ? null : goal.days

  return (
    <div className="ql-goal-form ql-transition-in">
      <Segment<Mode>
        label={t('goals.mode')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'span', text: t('goals.mode.span') },
          { value: 'count', text: t('goals.mode.count') }
        ]}
      />

      {mode === 'span' && (
        <>
          <div className="ql-goal-pick" role="group" aria-label={t('goals.pick')}>
            {GOAL_DAYS.map((d) => {
              const on = preset === d
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  title={t(on ? 'library.goalClear' : 'goals.pick')}
                  className={`tk-btn ${on ? 'tk-btn-primary' : 'tk-btn-ghost'} ql-goal-opt`}
                  onClick={() => onPick(on ? null : { days: d })}
                >
                  <span>{t(`library.goal.${d}`)}</span>
                  <span className="tk-mono ql-goal-opt-daily">
                    {t('goals.perDay', { daily: Math.ceil(open / d) })}
                  </span>
                </button>
              )
            })}
          </div>
          <form
            className="ql-goal-custom"
            onSubmit={(e) => {
              e.preventDefault()
              if (spanOk) onPick({ days })
            }}
          >
            <label className="tk-label" htmlFor={`${id}-span`}>
              {t('goals.custom')}
            </label>
            <input
              id={`${id}-span`}
              className="tk-input tk-mono"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_DAYS}
              value={span}
              aria-invalid={span !== '' && !spanOk}
              aria-describedby={`${id}-span-hint`}
              onChange={(e) => setSpan(e.target.value)}
            />
            <Segment<Unit>
              label={t('goals.unit')}
              value={unit}
              onChange={setUnit}
              options={UNITS.map((u) => ({ value: u, text: t(`goals.unit.${u}`) }))}
            />
            <button
              type="submit"
              className="tk-btn tk-btn-primary ql-btn-sm"
              disabled={!spanOk}
              title={spanOk ? undefined : t('goals.customHelp')}
            >
              {t('goals.set')}
            </button>
            <p id={`${id}-span-hint`} className="tk-hint ql-goal-custom-hint" aria-live="polite">
              {spanOk
                ? t('goals.perDay', { daily: Math.ceil(open / days) })
                : t('goals.customHelp')}
            </p>
          </form>
        </>
      )}

      {mode === 'count' && (
        <form
          className="ql-goal-custom"
          onSubmit={(e) => {
            e.preventDefault()
            if (countOk) onPick({ perDay })
          }}
        >
          <label className="tk-label" htmlFor={`${id}-count`}>
            {t('goals.count')}
          </label>
          <input
            id={`${id}-count`}
            className="tk-input tk-mono"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PER_DAY}
            value={count}
            aria-invalid={count !== '' && !countOk}
            aria-describedby={`${id}-count-hint`}
            onChange={(e) => setCount(e.target.value)}
          />
          <button
            type="submit"
            className="tk-btn tk-btn-primary ql-btn-sm"
            disabled={!countOk}
            title={countOk ? undefined : t('goals.countHelp')}
          >
            {t('goals.set')}
          </button>
          <p id={`${id}-count-hint`} className="tk-hint ql-goal-custom-hint" aria-live="polite">
            {countOk
              ? t('goals.countDays', { days: Math.max(1, Math.ceil(open / perDay)) })
              : t('goals.countHelp')}
          </p>
        </form>
      )}

      {goal && (
        <div className="ql-goal-clear">
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={() => onPick(null)}
          >
            {t('library.goalClear')}
          </button>
        </div>
      )}
    </div>
  )
}

export function GoalDialog({
  name,
  goal,
  open,
  onPick,
  onClose
}: {
  name: string
  goal: ModuleGoal | null
  open: number
  onPick(spec: GoalSpec | null): void
  onClose(): void
}): React.JSX.Element {
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  useLayer(panel, onClose)
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div
      className="tk-modal-scrim"
      data-tk-modal="info"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panel}
        className="tk-panel tk-modal ql-goal-dialog ql-transition-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <p className="tk-h3" id={id}>
          {t('goals.dialogTitle', { name })}
        </p>
        <p className="tk-hint">{t('goals.pick')}</p>
        <GoalPick goal={goal} open={open} onPick={onPick} />
        <div className="tk-modal-actions">
          <button type="button" className="tk-btn tk-btn-ghost" onClick={onClose} autoFocus>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
