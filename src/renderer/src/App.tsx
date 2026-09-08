import { useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { Toasts } from './components/Toast'
import { t } from './i18n'
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

  useEffect(() => {
    loadSettings()
    loadInfo()
  }, [loadSettings, loadInfo])

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
          {route.name === 'session' && <Session moduleId={route.moduleId} />}
        </main>
      </div>
      <Toasts />
    </div>
  )
}
