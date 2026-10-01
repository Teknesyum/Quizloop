import { useEffect, useState } from 'react'
import { tinykeys } from 'tinykeys'
import { FONT_SCALES } from '@shared/ipc'
import { TitleBar } from '../../../teknesyum-ui/ustcubuk/TitleBar'
import { UpdateTools } from './components/UpdateTools'
import { useBookWarmup } from './components/bookdoc'
import { Toasts } from './components/Toast'
import { WorkProgress } from './components/WorkProgress'
import { installedText, t } from './i18n'
import { Bank } from './screens/Bank'
import { Chapters } from './screens/Chapters'
import { Library } from './screens/Library'
import { Session } from './screens/Session'
import { Settings } from './screens/Settings'
import { Stats } from './screens/Stats'
import { useApp, type Route } from './store/app'

const GITHUB = 'https://github.com/Teknesyum'
const SPONSOR = 'https://github.com/sponsors/Teknesyum'

const NAV: { route: Route; label: string }[] = [
  { route: { name: 'library' }, label: t('nav.library') },
  { route: { name: 'stats' }, label: t('nav.stats') },
  { route: { name: 'settings' }, label: t('nav.settings') }
]

const TABS = NAV.map((n) => ({ id: n.route.name, label: n.label }))

export default function App(): React.JSX.Element {
  const route = useApp((s) => s.route)
  const go = useApp((s) => s.go)
  const loadSettings = useApp((s) => s.loadSettings)
  const loadInfo = useApp((s) => s.loadInfo)
  const settings = useApp((s) => s.settings)
  const saveSettings = useApp((s) => s.saveSettings)
  const scale = settings?.fontScale ?? 1
  const [max, setMax] = useState(false)
  useBookWarmup(route.name === 'session' || route.name === 'bank' ? route.moduleId : null)

  useEffect(() => {
    window.quizloop.window.isMaximized().then(setMax)
    return window.quizloop.window.onMaximized(setMax)
  }, [])

  useEffect(() => {
    loadSettings()
    loadInfo()
  }, [loadSettings, loadInfo])

  useEffect(() => {
    const off = window.quizloop.module.onInstalled((r) => {
      const { toast, loadModules } = useApp.getState()
      if (r.ok) {
        toast('success', installedText(r))
        go({ name: 'library' })
      } else toast('danger', `${t('library.installFailed')}: ${r.error ?? ''}`)
      loadModules()
    })
    window.quizloop.module.drainOpened()
    return off
  }, [go])

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
  const win = window.quizloop.window

  return (
    <div className="ql-shell">
      <TitleBar
        first="Quiz"
        second="loop"
        links={{ brand: GITHUB, sponsor: SPONSOR }}
        labels={{
          sponsor: t('sig.support'),
          sponsorTitle: t('sig.supportTitle'),
          brand: t('sig.brand'),
          brandTitle: t('sig.brandTitle'),
          minimize: t('win.minimize'),
          maximize: t('win.maximize'),
          restore: t('win.restore'),
          close: t('win.close'),
          tabs: t('app.name')
        }}
        maximized={max}
        tabs={inSession ? undefined : TABS}
        current={route.name === 'stats' || route.name === 'settings' ? route.name : 'library'}
        onTab={(id) => {
          const n = NAV.find((x) => x.route.name === id)
          if (n) go(n.route)
        }}
        language={<UpdateTools />}
        onMinimize={() => win.minimize()}
        onMaximize={() => win.toggleMaximize()}
        onClose={() => win.close()}
      />
      <div className="ql-body">
        <main className="ql-main" key={route.name}>
          {route.name === 'library' && <Library />}
          {route.name === 'stats' && <Stats />}
          {route.name === 'settings' && <Settings />}
          {route.name === 'chapters' && <Chapters moduleId={route.moduleId} />}
          {route.name === 'bank' && <Bank moduleId={route.moduleId} filter={route.filter} />}
          {route.name === 'session' && (
            <Session moduleId={route.moduleId} chapter={route.chapter ?? null} />
          )}
        </main>
      </div>
      <WorkProgress />
      <Toasts />
    </div>
  )
}
