import { useEffect, useState } from 'react'
import type { ChapterSummary } from '@shared/ipc'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

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

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{mod?.name ?? moduleId}</h2>
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

      {rows !== null && (
        <div className="ql-grid">
          {rows.map((c, i) => (
            <article
              key={c.chapter || 'none'}
              className="tk-panel ql-card ql-cover-card ql-transition-in"
              style={{ '--ql-i': i } as React.CSSProperties}
            >
              {chapterCover(c) && (
                <img className="ql-cover" src={chapterCover(c) as string} alt="" />
              )}
              <header className="ql-card-head">
                <h3 className="tk-h3">{c.chapter || t('chapters.unsorted')}</h3>
                <span className="tk-mono ql-percent">
                  {c.total ? Math.round((c.retired / c.total) * 100) : 0}%
                </span>
              </header>
              <dl className="ql-card-stats">
                <div className={c.dueToday ? 'ql-stat-hot' : ''}>
                  <dt className="tk-hint">{t('library.card.due', { count: c.dueToday })}</dt>
                </div>
                <div>
                  <dt className="tk-hint">{t('library.card.unseen', { count: c.unseen })}</dt>
                </div>
                <div>
                  <dt className="tk-hint">{t('library.card.retired', { count: c.retired })}</dt>
                </div>
              </dl>
              <div
                className="ql-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={c.total}
                aria-valuenow={c.retired}
              >
                <span style={{ width: `${c.total ? (c.retired / c.total) * 100 : 0}%` }} />
              </div>
              <footer className="ql-card-foot">
                <span className="tk-hint">{t('library.card.questions', { count: c.total })}</span>
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
