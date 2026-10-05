import { useEffect, useState } from 'react'
import { CardCover } from '@renderer/components/CardCover'
import { CardInfo, CardMeter, GoalMeter } from '@renderer/components/CardFacts'
import { GoalMenu } from '@renderer/components/CardMenu'
import { goalToast, saveGoal } from '@renderer/goal'
import { tinykeys } from 'tinykeys'
import { goalKey, type ChapterSummary } from '@shared/ipc'
import { Skeleton } from '@renderer/components/Skeleton'
import { ViewToggle } from '@renderer/components/ViewToggle'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { useView } from '@renderer/view'

function chapterCover(c: ChapterSummary): string | null {
  const m = c.chapter.match(/^\s*(\d+)/)
  return m ? `${c.assetBase}assets/bolum/${m[1]}.webp` : null
}

export function Chapters({ moduleId }: { moduleId: string }): React.JSX.Element {
  const go = useApp((s) => s.go)
  const modules = useApp((s) => s.modules)
  const [rows, setRows] = useState<ChapterSummary[] | null>(null)
  const mod = modules?.find((m) => m.id === moduleId)

  useEffect(() => {
    window.quizloop.module.chapters(moduleId).then(setRows)
  }, [moduleId])

  const pick = async (chapter: string, days: number | null): Promise<void> => {
    await saveGoal(goalKey(moduleId, chapter), days)
    const next = await window.quizloop.module.chapters(moduleId)
    setRows(next)
    goalToast(next.find((x) => x.chapter === chapter)?.goal?.daily)
  }

  const [active, setActive] = useState(0)
  const [view, setView] = useView()

  useEffect(() => {
    if (!rows?.length) return
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
  }, [rows, active, go, moduleId])

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
            {t('goals.left', {
              days: mod.goal.daysLeft,
              date: new Date(mod.goal.until).toLocaleDateString(),
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
                <GoalMenu
                  goal={c.goal}
                  open={c.unseen + c.dueToday + c.learning + c.retiredToday}
                  onPick={(d) => void pick(c.chapter, d)}
                />
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
    </section>
  )
}
