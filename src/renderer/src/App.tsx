import { useEffect } from 'react'
import { tinykeys } from 'tinykeys'
import { FONT_SCALES } from '@shared/ipc'
import { TitleBar } from './components/TitleBar'
import { Toasts } from './components/Toast'
import { t } from './i18n'
import { Chapters } from './screens/Chapters'
import { Library } from './screens/Library'
import { Session } from './screens/Session'
import { Settings } from './screens/Settings'
import { Stats } from './screens/Stats'
import { useApp, type Route } from './store/app'

const NAV: { route: Route; label: string; glyph: string }[] = [
  { route: { name: 'library' }, label: t('nav.library'), glyph: '▤' },
  { route: { name: 'stats' }, label: t('nav.stats'), glyph: '▥' },
  { route: { name: 'settings' }, label: t('nav.settings'), glyph: '⚙' }
]

export default function App(): React.JSX.Element {
  const route = useApp((s) => s.route)
  const go = useApp((s) => s.go)
  const loadSettings = useApp((s) => s.loadSettings)
  const loadInfo = useApp((s) => s.loadInfo)
  const settings = useApp((s) => s.settings)
  const saveSettings = useApp((s) => s.saveSettings)
  const scale = settings?.fontScale ?? 1

  useEffect(() => {
    loadSettings()
    loadInfo()
  }, [loadSettings, loadInfo])

  useEffect(() => {
    window.quizloop.settings.zoom(scale)
  }, [scale])

  useEffect(() => {
    const step = (dir: number): void => {
      const i = FONT_SCALES.indexOf(scale as (typeof FONT_SCALES)[number])
      const at = i === -1 ? FONT_SCALES.indexOf(1) : i
      const next = FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, at + dir))]
      if (next !== scale) saveSettings({ fontScale: next })
    }
    return tinykeys(window, {
      '$mod+Equal': (e) => {
        e.preventDefault()
        step(1)
      },
      '$mod+Minus': (e) => {
        e.preventDefault()
        step(-1)
      },
      '$mod+Digit0': (e) => {
        e.preventDefault()
        if (scale !== 1) saveSettings({ fontScale: 1 })
      }
    })
  }, [scale, saveSettings])

  const inSession = route.name === 'session'

  return (
    <div className="ql-shell">
      <TitleBar />
      <div className={`ql-body ${inSession ? 'ql-body-focus' : ''}`}>
        {!inSession && (
          <nav className="ql-sidebar" aria-label={t('app.name')}>
            {NAV.map((n, i) => (
              <button
                key={n.route.name}
                type="button"
                className={`ql-nav ql-transition-in ${route.name === n.route.name ? 'ql-nav-active' : ''}`}
                style={{ '--ql-i': i } as React.CSSProperties}
                onClick={() => go(n.route)}
                aria-current={route.name === n.route.name ? 'page' : undefined}
              >
                <span aria-hidden="true" className="ql-nav-glyph">
                  {n.glyph}
                </span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        )}
        <main className="ql-main" key={route.name}>
          {route.name === 'library' && <Library />}
          {route.name === 'stats' && <Stats />}
          {route.name === 'settings' && <Settings />}
          {route.name === 'chapters' && <Chapters moduleId={route.moduleId} />}
          {route.name === 'session' && (
            <Session moduleId={route.moduleId} chapter={route.chapter ?? null} />
          )}
        </main>
      </div>
      <Toasts />
    </div>
  )
}
