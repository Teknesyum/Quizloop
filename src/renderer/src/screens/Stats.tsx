import { useEffect, useState } from 'react'
import type { StatsOverview } from '@shared/ipc'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'

export function Stats(): React.JSX.Element {
  const [data, setData] = useState<StatsOverview | null>(null)
  useEffect(() => {
    window.quizloop.stats.overview().then(setData)
  }, [])

  const tiles: [string, number | string][] = data
    ? [
        [t('stats.modules'), data.modules],
        [t('stats.cards'), data.cards],
        [t('stats.dueToday'), data.dueToday],
        [t('stats.reviewsTotal'), data.reviewsTotal],
        [t('stats.reviews7d'), data.reviews7d],
        [t('stats.retired'), data.retired]
      ]
    : []
  const max = data ? Math.max(1, ...data.perDay.map((d) => d.reviews)) : 1

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('stats.title')}</h2>
          <p className="tk-hint">{t('stats.subtitle')}</p>
        </div>
        {data && <span className="tk-label">{t('stats.streak', { count: data.streakDays })}</span>}
      </header>

      {!data && (
        <div className="tk-panel">
          <Skeleton lines={4} />
        </div>
      )}

      {data && (
        <>
          <div className="ql-tiles">
            {tiles.map(([label, value], i) => (
              <div
                key={label}
                className="tk-panel ql-tile ql-transition-in"
                style={{ '--ql-i': i } as React.CSSProperties}
              >
                <span className="tk-hint">{label}</span>
                <span className="tk-mono ql-tile-value">{value}</span>
              </div>
            ))}
          </div>
          <div className="tk-panel ql-transition-in">
            <h3 className="tk-h3 tk-h3-rule">{t('stats.chart')}</h3>
            {data.perDay.length === 0 && <p className="tk-hint">{t('stats.empty')}</p>}
            {data.perDay.length > 0 && (
              <ol className="ql-bars">
                {data.perDay.map((d, i) => (
                  <li
                    key={d.day}
                    className="ql-bar"
                    style={
                      {
                        '--ql-i': i,
                        '--ql-h': `${(d.reviews / max) * 100}%`
                      } as React.CSSProperties
                    }
                    title={t('stats.chartBar', d)}
                  >
                    <span className="ql-bar-fill" />
                    <span className="tk-sr-only">{t('stats.chartBar', d)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </section>
  )
}
