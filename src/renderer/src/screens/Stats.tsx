import { useEffect, useMemo, useRef, useState } from 'react'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Group } from '@visx/group'
import { HeatmapRect } from '@visx/heatmap'
import { scaleBand, scaleLinear } from '@visx/scale'
import { Bar } from '@visx/shape'
import type { CardStatus, StatsOverview } from '@shared/ipc'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

const WEEKS = 26
const BAR_DAYS = 30
const STATES: CardStatus[] = ['yeni', 'ogreniyor', 'tekrar', 'emekli']
const STATE_FILL: Record<CardStatus, string> = {
  yeni: 'var(--tk-border-strong)',
  ogreniyor: 'var(--tk-pink)',
  tekrar: 'var(--tk-blue)',
  emekli: 'var(--tk-success)'
}

interface Day {
  day: string
  reviews: number
  correct: number
  future: boolean
}

function dayKey(d: Date, hour: number): string {
  const x = new Date(d)
  x.setHours(hour, 0, 0, 0)
  return x.toISOString().slice(0, 10)
}

function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function shortDate(key: string): string {
  const [, m, d] = key.split('-')
  return `${d}.${m}`
}

function Heatmap({ days }: { days: Day[][] }): React.JSX.Element {
  const [ref, width] = useWidth()
  const max = Math.max(1, ...days.flat().map((d) => d.reviews))
  const labelW = 40
  const bin = Math.max(8, Math.min(22, Math.floor((width - labelW) / WEEKS)))
  const height = bin * 7
  const opacity = scaleLinear<number>({ domain: [1, max], range: [0.3, 1] })
  const rows = [0, 2, 4, 6]
  return (
    <div ref={ref} className="ql-chart">
      {width > 0 && (
        <svg
          width={labelW + bin * WEEKS}
          height={height}
          role="img"
          aria-label={t('stats.heatmap')}
        >
          <Group left={labelW}>
            <HeatmapRect<Day[], Day>
              data={days}
              xScale={(c) => c * bin}
              yScale={(r) => r * bin}
              binWidth={bin}
              binHeight={bin}
              gap={3}
              bins={(col) => col}
              count={(d) => d.reviews}
            >
              {(cells) =>
                cells.flat().map((c) => (
                  <rect
                    key={`${c.column}-${c.row}`}
                    className="ql-heat-cell"
                    x={c.x}
                    y={c.y - c.gap}
                    width={c.width}
                    height={c.height}
                    rx={2}
                    fill={
                      c.bin.future
                        ? 'transparent'
                        : c.bin.reviews
                          ? 'var(--tk-purple)'
                          : 'var(--tk-border)'
                    }
                    fillOpacity={c.bin.reviews ? opacity(c.bin.reviews) : 1}
                  >
                    {!c.bin.future && (
                      <title>
                        {t('stats.chartBar', {
                          day: shortDate(c.bin.day),
                          reviews: c.bin.reviews,
                          correct: c.bin.correct
                        })}
                      </title>
                    )}
                  </rect>
                ))
              }
            </HeatmapRect>
          </Group>
          {rows.map((r) => (
            <text
              key={r}
              className="ql-chart-label"
              x={0}
              y={r * bin + bin / 2}
              dominantBaseline="middle"
            >
              {t(`stats.weekday.${r}` as 'stats.weekday.0')}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}

function Bars({ days }: { days: Day[] }): React.JSX.Element {
  const [ref, width] = useWidth()
  const height = 180
  const m = { top: 8, right: 8, bottom: 24, left: 32 }
  const innerW = Math.max(0, width - m.left - m.right)
  const innerH = height - m.top - m.bottom
  const x = useMemo(
    () => scaleBand<string>({ domain: days.map((d) => d.day), range: [0, innerW], padding: 0.25 }),
    [days, innerW]
  )
  const max = Math.max(4, ...days.map((d) => d.reviews))
  const y = useMemo(
    () => scaleLinear<number>({ domain: [0, max], range: [innerH, 0], nice: true }),
    [max, innerH]
  )
  const ticks = days.filter((_, i) => i % 5 === 4).map((d) => d.day)
  return (
    <div ref={ref} className="ql-chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={t('stats.chart')}>
          <Group left={m.left} top={m.top}>
            {days.map((d) => {
              const bx = x(d.day) ?? 0
              const bw = x.bandwidth()
              return (
                <g key={d.day}>
                  <Bar
                    x={bx}
                    y={y(d.reviews)}
                    width={bw}
                    height={innerH - y(d.reviews)}
                    rx={2}
                    fill="var(--tk-blue)"
                    fillOpacity={0.35}
                  />
                  <Bar
                    x={bx}
                    y={y(d.correct)}
                    width={bw}
                    height={innerH - y(d.correct)}
                    rx={2}
                    fill="var(--tk-blue)"
                  >
                    <title>
                      {t('stats.chartBar', {
                        day: shortDate(d.day),
                        reviews: d.reviews,
                        correct: d.correct
                      })}
                    </title>
                  </Bar>
                </g>
              )
            })}
            <AxisLeft
              scale={y}
              tickValues={y.ticks(4).filter((v) => Number.isInteger(v))}
              tickFormat={(v) => String(v)}
              stroke="var(--tk-border)"
              tickStroke="var(--tk-border)"
              tickLabelProps={() => ({ className: 'ql-chart-label', textAnchor: 'end', dx: -4 })}
            />
            <AxisBottom
              top={innerH}
              scale={x}
              tickValues={ticks}
              tickFormat={shortDate}
              stroke="var(--tk-border)"
              tickStroke="var(--tk-border)"
              tickLabelProps={() => ({ className: 'ql-chart-label', textAnchor: 'middle' })}
            />
          </Group>
        </svg>
      )}
    </div>
  )
}

export function Stats(): React.JSX.Element {
  const [data, setData] = useState<StatsOverview | null>(null)
  const hour = useApp((s) => s.settings?.dayStartHour ?? 4)
  useEffect(() => {
    window.quizloop.stats.overview().then(setData)
  }, [])

  const { weeks, recent } = useMemo(() => {
    const by = new Map((data?.perDay ?? []).map((d) => [d.day, d]))
    const today = new Date()
    if (today.getHours() < hour) today.setDate(today.getDate() - 1)
    const monday = (today.getDay() + 6) % 7
    const start = new Date(today)
    start.setDate(today.getDate() - monday - (WEEKS - 1) * 7)
    const todayKey = dayKey(today, hour)
    const weeks: Day[][] = []
    for (let w = 0; w < WEEKS; w++) {
      const col: Day[] = []
      for (let r = 0; r < 7; r++) {
        const d = new Date(start)
        d.setDate(start.getDate() + w * 7 + r)
        const key = dayKey(d, hour)
        const hit = by.get(key)
        col.push({
          day: key,
          reviews: hit?.reviews ?? 0,
          correct: hit?.correct ?? 0,
          future: key > todayKey
        })
      }
      weeks.push(col)
    }
    const recent: Day[] = []
    for (let i = BAR_DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = dayKey(d, hour)
      const hit = by.get(key)
      recent.push({
        day: key,
        reviews: hit?.reviews ?? 0,
        correct: hit?.correct ?? 0,
        future: false
      })
    }
    return { weeks, recent }
  }, [data, hour])

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
  const stateTotal = data
    ? Math.max(
        1,
        STATES.reduce((a, s) => a + data.states[s], 0)
      )
    : 1

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
            <h3 className="tk-h3 tk-h3-rule">{t('stats.heatmap')}</h3>
            <Heatmap days={weeks} />
          </div>

          <div className="tk-panel ql-transition-in">
            <h3 className="tk-h3 tk-h3-rule">{t('stats.chart')}</h3>
            {data.reviewsTotal === 0 ? (
              <p className="tk-hint">{t('stats.empty')}</p>
            ) : (
              <Bars days={recent} />
            )}
          </div>

          <div className="tk-panel ql-transition-in">
            <h3 className="tk-h3 tk-h3-rule">{t('stats.states')}</h3>
            <div className="ql-stack" role="img" aria-label={t('stats.states')}>
              {STATES.map((s) => (
                <span
                  key={s}
                  className="ql-stack-part"
                  style={
                    {
                      '--ql-w': `${(data.states[s] / stateTotal) * 100}%`,
                      '--ql-fill': STATE_FILL[s]
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <ul className="ql-legend">
              {STATES.map((s) => (
                <li key={s}>
                  <span
                    className="ql-legend-dot"
                    style={{ '--ql-fill': STATE_FILL[s] } as React.CSSProperties}
                  />
                  <span>{t(`stats.state.${s}`)}</span>
                  <span className="tk-mono">{data.states[s]}</span>
                </li>
              ))}
            </ul>
          </div>

          {data.progress.length > 0 && (
            <div className="tk-panel ql-transition-in">
              <h3 className="tk-h3 tk-h3-rule">{t('stats.progress')}</h3>
              <ul className="ql-progress-list">
                {data.progress.map((p) => (
                  <li key={p.id}>
                    <span className="ql-progress-name">{p.name}</span>
                    <span
                      className="ql-progress-track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={p.total}
                      aria-valuenow={p.seen}
                      aria-label={p.name}
                    >
                      <span
                        className="ql-progress-seen"
                        style={
                          {
                            '--ql-w': `${(p.seen / Math.max(1, p.total)) * 100}%`
                          } as React.CSSProperties
                        }
                      />
                      <span
                        className="ql-progress-retired"
                        style={
                          {
                            '--ql-w': `${(p.retired / Math.max(1, p.total)) * 100}%`
                          } as React.CSSProperties
                        }
                      />
                    </span>
                    <span className="tk-mono tk-hint">
                      {t('stats.progressLine', {
                        seen: p.seen,
                        retired: p.retired,
                        total: p.total
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
