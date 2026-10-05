import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GOAL_DAYS, type ModuleSummary } from '@shared/ipc'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

type Spot = { right?: number; left?: number; top?: number; bottom?: number }

export function CardMenu({
  label,
  text,
  children
}: {
  label: string
  text?: string
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [spot, setSpot] = useState<Spot | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    const right = window.innerWidth - r.right
    const below = window.innerHeight - r.bottom
    setSpot(
      below < r.top ? { right, bottom: window.innerHeight - r.top } : { right, top: r.bottom }
    )
  }, [open])

  useLayoutEffect(() => {
    if (!spot || spot.left !== undefined || !list.current || !btn.current) return
    if (list.current.getBoundingClientRect().left >= 0) return
    setSpot({ top: spot.top, bottom: spot.bottom, left: btn.current.getBoundingClientRect().left })
  }, [spot])

  useEffect(() => {
    if (!open) return
    list.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })
    const close = (): void => setOpen(false)
    const down = (e: PointerEvent): void => {
      const at = e.target as Node
      if (!list.current?.contains(at) && !btn.current?.contains(at)) close()
    }
    const key = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
      btn.current?.focus()
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key, true)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, spot])

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`tk-btn tk-btn-ghost ql-btn-sm ${text ? '' : 'ql-menu-btn'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={text ? undefined : label}
        title={label}
        onClick={() => setOpen((o) => !o)}
      >
        {text ?? '⋯'}
      </button>
      {open &&
        spot &&
        createPortal(
          <div
            ref={list}
            className="tk-panel ql-menu ql-transition-in"
            role="menu"
            aria-label={label}
            style={spot}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

export function MenuItem({
  danger,
  onPick,
  children
}: {
  danger?: boolean
  onPick(): void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="menuitem"
      className={`ql-menu-opt ${danger ? 'ql-menu-danger' : ''}`}
      onClick={onPick}
    >
      {children}
    </button>
  )
}

function untilOf(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

async function setGoal(m: ModuleSummary, days: number | null): Promise<void> {
  const app = useApp.getState()
  const goals = { ...(app.settings?.goals ?? {}) }
  if (days === null) delete goals[m.id]
  else goals[m.id] = { days, until: untilOf(days) }
  await app.saveSettings({ goals })
  await app.loadModules()
  const daily = useApp.getState().modules?.find((x) => x.id === m.id)?.goal?.daily
  app.toast('success', daily ? t('library.goalDone', { daily }) : t('library.goalCleared'))
}

export function GoalMenu({ m }: { m: ModuleSummary }): React.JSX.Element {
  const open = m.unseen + m.dueToday + m.learning + m.retiredToday
  return (
    <CardMenu
      label={t('library.goalHelp')}
      text={
        m.goal
          ? t('library.goalSet', {
              span: t(`library.goal.${m.goal.days as (typeof GOAL_DAYS)[number]}`)
            })
          : t('library.goal')
      }
    >
      {GOAL_DAYS.map((d) => (
        <MenuItem key={d} onPick={() => setGoal(m, d)}>
          {t('library.goalRow', { span: t(`library.goal.${d}`), daily: Math.ceil(open / d) })}
        </MenuItem>
      ))}
      {m.goal && (
        <MenuItem danger onPick={() => setGoal(m, null)}>
          {t('library.goalClear')}
        </MenuItem>
      )}
    </CardMenu>
  )
}
