import { useEffect, useMemo, useState } from 'react'
import { CardCover } from '@renderer/components/CardCover'
import { CardInfo, CardMeter, GoalMeter } from '@renderer/components/CardFacts'
import { CardMenu, MenuItem } from '@renderer/components/CardMenu'
import { Confirm } from '@renderer/components/Confirm'
import { GoalDialog } from '@renderer/components/GoalPick'
import { goalLabel, goalToast, saveGoal, type GoalSpec } from '@renderer/goal'
import { tinykeys } from 'tinykeys'
import { goalKey, type ChapterSummary } from '@shared/ipc'
import { ordered } from '@shared/order'
import { useOrder } from '@renderer/hooks/useOrder'
import { Skeleton } from '@renderer/components/Skeleton'
import { ViewToggle } from '@renderer/components/ViewToggle'
import { lang, t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { useView } from '@renderer/view'

function chapterCover(c: ChapterSummary): string | null {
  const m = c.chapter.match(/^\s*(\d+)/)
  return m ? `${c.assetBase}assets/bolum/${m[1]}.webp` : null
}

export function Chapters({ moduleId }: { moduleId: string }): React.JSX.Element {
  const go = useApp((s) => s.go)
  const modules = useApp((s) => s.modules)
  const [loaded, setRows] = useState<ChapterSummary[] | null>(null)
  const { order, move } = useOrder(moduleId)
  const rows = useMemo(() => loaded && ordered(loaded, (c) => c.chapter, order), [loaded, order])
  const ids = rows?.map((c) => c.chapter) ?? []
  const [resetting, setResetting] = useState<ChapterSummary | null>(null)
  const [goaling, setGoaling] = useState<ChapterSummary | null>(null)
  const toast = useApp((s) => s.toast)
  const loadModules = useApp((s) => s.loadModules)
  const mod = modules?.find((m) => m.id === moduleId)

  useEffect(() => {
    window.quizloop.module
      .chapters(moduleId)
      .then(setRows)
      .catch((e: unknown) => {
        setRows([])
        useApp.getState().toast('danger', `${t('common.error')}: ${String(e)}`)
      })
  }, [moduleId])

  const pick = async (chapter: string, spec: GoalSpec | null): Promise<void> => {
    await saveGoal(goalKey(moduleId, chapter), spec)
    setGoaling(null)
    const next = await window.quizloop.module.chapters(moduleId)
    setRows(next)
    goalToast(next.find((x) => x.chapter === chapter)?.goal?.daily)
  }

  const [active, setActive] = useState(0)
  const [view, setView] = useView()

  useEffect(() => {
    if (!rows?.length || resetting || goaling) return
    const count = rows.length
    const focus = (i: number): void => {
      const next = (i + count) % count
      setActive(next)
      document.getElementById(`ql-chapter-${next}`)?.focus()
    }
    const step = (d: number) => (e: KeyboardEvent) => {
      e.preventDefault()
      focus(active + d)
    }
    return tinykeys(window, {
      ArrowDown: step(1),
      ArrowRight: step(1),
      ArrowUp: step(-1),
      ArrowLeft: step(-1),
      Enter: (e) => {
        if ((e.target as HTMLElement).closest('button')) return
        const c = rows[active]
        if (!c) return
        e.preventDefault()
        go({ name: 'session', moduleId, chapter: c.chapter })
      },
      Escape: (e) => {
        e.preventDefault()
        go({ name: 'library' })
      }
    })
  }, [rows, active, go, moduleId, resetting, goaling])

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{mod?.name ?? moduleId}</h2>
          {mod && (
            <p className="tk-mono ql-tag ql-tag-version">
              {t('library.card.version', { version: mod.version })}
            </p>
          )}
          <p className="tk-hint">{t('chapters.subtitle')}</p>
        </div>
        <div className="ql-head-actions">
          <button
            type="button"
            className="tk-btn tk-btn-ghost"
            onClick={() => go({ name: 'library' })}
          >
            {t('summary.back')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-primary"
            onClick={() => go({ name: 'session', moduleId, chapter: null })}
          >
            {t('chapters.all')}
          </button>
        </div>
      </header>

      {mod?.goal && (
        <div className="tk-panel ql-chapter-goal ql-transition-in">
          <GoalMeter done={mod.retiredToday} goal={mod.goal} />
          <p className="tk-hint ql-goal-line">
            {t(mod.goal.perDay ? 'goals.leftCount' : 'goals.left', {
              days: mod.goal.daysLeft,
              date: new Date(mod.goal.until).toLocaleDateString(lang),
              count: mod.unseen + mod.dueToday + mod.learning
            })}
          </p>
        </div>
      )}

      {rows === null && (
        <div className="ql-grid">
          <div className="tk-panel">
            <Skeleton lines={3} />
          </div>
          <div className="tk-panel">
            <Skeleton lines={3} />
          </div>
        </div>
      )}

      {rows !== null && rows.length > 0 && <ViewToggle view={view} onChange={setView} />}

      {rows !== null && (
        <div className={`ql-grid ${view === 'list' ? 'ql-grid-list' : ''}`}>
          {rows.map((c, i) => (
            <article
              key={c.chapter || 'none'}
              id={`ql-chapter-${i}`}
              tabIndex={i === active ? 0 : -1}
              aria-label={c.chapter || t('chapters.unsorted')}
              onFocus={() => setActive(i)}
              className={`tk-panel ql-card ql-transition-in ${i === active ? 'ql-card-active' : ''}`}
              style={{ '--ql-i': i } as React.CSSProperties}
            >
              <header className="ql-card-head">
                <h3 className="tk-h3" title={c.chapter || t('chapters.unsorted')}>
                  {c.chapter || t('chapters.unsorted')}
                </h3>
                <span className="tk-mono ql-percent">
                  {c.total ? Math.round((c.retired / c.total) * 100) : 0}%
                </span>
              </header>
              <div className="ql-card-body">
                <CardCover src={chapterCover(c)} name={c.chapter || t('chapters.unsorted')} foot />
                <CardInfo c={c} />
              </div>
              <CardMeter total={c.total} retired={c.retired} />
              {c.goal && <GoalMeter done={c.retiredToday} goal={c.goal} />}
              <footer className="ql-card-foot">
                <CardMenu label={t('library.more')}>
                  {i > 0 && (
                    <MenuItem onPick={() => move(ids, c.chapter, -1)}>
                      {t('library.moveUp')}
                    </MenuItem>
                  )}
                  {i < ids.length - 1 && (
                    <MenuItem onPick={() => move(ids, c.chapter, 1)}>
                      {t('library.moveDown')}
                    </MenuItem>
                  )}
                  <MenuItem onPick={() => setResetting(c)}>{t('library.reset')}</MenuItem>
                </CardMenu>
                <button
                  type="button"
                  className="tk-btn tk-btn-ghost ql-btn-sm"
                  title={t('library.goalHelp')}
                  onClick={() => setGoaling(c)}
                >
                  {goalLabel(c)}
                </button>
                <button
                  type="button"
                  className="tk-btn tk-btn-primary ql-btn-sm"
                  onClick={() => go({ name: 'session', moduleId, chapter: c.chapter })}
                >
                  {t('library.start')}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {goaling && (
        <GoalDialog
          name={goaling.chapter || t('chapters.unsorted')}
          goal={goaling.goal}
          open={goaling.unseen + goaling.dueToday + goaling.learning + goaling.retiredToday}
          onClose={() => setGoaling(null)}
          onPick={(spec) => void pick(goaling.chapter, spec)}
        />
      )}

      {resetting && (
        <Confirm
          title={t('library.resetConfirmTitle', {
            name: resetting.chapter || t('chapters.unsorted')
          })}
          text={t('chapters.resetConfirm')}
          yes={t('library.reset')}
          danger
          onNo={() => setResetting(null)}
          onYes={async () => {
            await window.quizloop.module.reset(moduleId, resetting.chapter)
            setResetting(null)
            setRows(await window.quizloop.module.chapters(moduleId))
            await loadModules()
            toast('success', t('chapters.resetDone'))
          }}
        />
      )}
    </section>
  )
}
