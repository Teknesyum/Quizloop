import { useEffect, useState } from 'react'
import { tinykeys } from 'tinykeys'
import { LangSwitch, TitleBar } from '../../../teknesyum-ui/ustcubuk/TitleBar'
import { runBack } from './back'
import { remind } from './remind'
import { Confirm } from './components/Confirm'
import { ScaleSwitch } from './components/ScaleSwitch'
import { TopMenu } from './components/TopMenu'
import { useUpdateTools } from './components/UpdateTools'
import { useBookWarmup } from './components/bookdoc'
import { useUpdate } from './hooks/useUpdate'
import { Toasts } from './components/Toast'
import { Welcome } from './components/Welcome'
import { WorkProgress } from './components/WorkProgress'
import { installedText, lang, setLang, t } from './i18n'
import { Bank } from './screens/Bank'
import { Chapters } from './screens/Chapters'
import { Library } from './screens/Library'
import { Session } from './screens/Session'
import { Settings } from './screens/Settings'
import { Goals } from './screens/Goals'
import { Stats } from './screens/Stats'
import { nextScale } from './scale'
import { useApp, type Route } from './store/app'
import logo from '../../../resources/icon.png'
import type { InstallConfirm } from '@shared/ipc'

const GITHUB = 'https://github.com/Teknesyum'
const SPONSOR = 'https://github.com/sponsors/Teknesyum'

const NAV: { route: Route; label: string }[] = [
  { route: { name: 'library' }, label: t('nav.library') },
  { route: { name: 'goals' }, label: t('nav.goals') },
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
  const help = useApp((s) => s.help)
  const showHelp = useApp((s) => s.showHelp)
  const welcome = help || (settings !== null && !settings.welcomeSeen)
  const [max, setMax] = useState(false)
  const [changes, setChanges] = useState<InstallConfirm[]>([])
  const change = changes[0]
  useBookWarmup(route.name === 'session' || route.name === 'bank' ? route.moduleId : null)

  const caps = window.quizloop.capabilities
  const tools = useUpdateTools()
  const up = useUpdate()
  const autoUpdate = settings?.autoUpdate === true

  useEffect(() => {
    if (autoUpdate && up.state === 'ready' && route.name !== 'session')
      window.quizloop.update.install()
  }, [autoUpdate, up.state, route.name])

  useEffect(
    () =>
      window.quizloop.app.onBack(() => {
        if (runBack()) return
        const at = useApp.getState().route
        if (at.name === 'library') window.quizloop.window.close()
        else if (at.name === 'session') go({ name: 'chapters', moduleId: at.moduleId })
        else go({ name: 'library' })
      }),
    [go]
  )

  useEffect(() => {
    window.quizloop.window.isMaximized().then(setMax)
    return window.quizloop.window.onMaximized(setMax)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [])

  const goalNotify = settings?.goalNotify
  const modules = useApp((s) => s.modules)
  useEffect(() => {
    if (!goalNotify || !modules) return
    remind(modules)
    const id = window.setInterval(() => remind(useApp.getState().modules ?? []), 600_000)
    return () => window.clearInterval(id)
  }, [goalNotify, modules])

  useEffect(() => {
    loadSettings()
    loadInfo()
  }, [loadSettings, loadInfo])

  useEffect(() => {
    const off = window.quizloop.module.onInstalled((r) => {
      const { toast, loadModules } = useApp.getState()
      if (r.cancelled) return
      if (r.ok) {
        toast('success', installedText(r))
        go({ name: 'library' })
      } else toast('danger', `${t('library.installFailed')}: ${r.error ?? ''}`)
      loadModules()
    })
    window.quizloop.module.drainOpened()
    return off
  }, [go])

  useEffect(() => window.quizloop.module.onConfirm((c) => setChanges((list) => [...list, c])), [])

  const answer = (yes: boolean): void => {
    if (!change) return
    window.quizloop.module.answer(change.ask, yes)
    setChanges((list) => list.slice(1))
  }

  useEffect(() => {
    window.quizloop.settings.zoom(scale)
  }, [scale])

  useEffect(() => {
    const step = (dir: number): void => {
      const next = nextScale(scale, dir)
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
    <div
      className="ql-shell"
      data-chrome={caps.windowChrome ? 'window' : 'none'}
      data-keys={caps.shortcuts ? 'on' : 'off'}
    >
      <TitleBar
        first="Quiz"
        second="Loop"
        logo={logo}
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
        current={
          route.name === 'goals' || route.name === 'stats' || route.name === 'settings'
            ? route.name
            : 'library'
        }
        onTab={(id) => {
          const n = NAV.find((x) => x.route.name === id)
          if (n) go(n.route)
        }}
        version={caps.updater ? tools.version : tools.label}
        update={caps.updater ? tools.update : undefined}
        language={
          caps.windowChrome ? (
            <>
              <ScaleSwitch scale={scale} onChange={(next) => saveSettings({ fontScale: next })} />
              <LangSwitch lang={lang} label={t('lang.label')} onChange={setLang} />
            </>
          ) : (
            <TopMenu
              scale={scale}
              lang={lang}
              links={{ brand: GITHUB, sponsor: SPONSOR }}
              onScale={(next) => saveSettings({ fontScale: next })}
              onLang={setLang}
            />
          )
        }
        onMinimize={() => win.minimize()}
        onMaximize={() => win.toggleMaximize()}
        onClose={() => win.close()}
      />
      <div className="ql-body">
        <main className="ql-main" key={route.name}>
          {route.name === 'library' && <Library />}
          {route.name === 'goals' && <Goals />}
          {route.name === 'stats' && <Stats />}
          {route.name === 'settings' && <Settings />}
          {route.name === 'chapters' && <Chapters moduleId={route.moduleId} />}
          {route.name === 'bank' && <Bank moduleId={route.moduleId} filter={route.filter} />}
          {route.name === 'session' && (
            <Session moduleId={route.moduleId} chapter={route.chapter ?? null} />
          )}
        </main>
      </div>
      {welcome && (
        <Welcome
          onClose={() => {
            showHelp(false)
            if (!settings?.welcomeSeen) saveSettings({ welcomeSeen: true })
          }}
        />
      )}
      <WorkProgress />
      {change && (
        <Confirm
          title={t('library.downgradeConfirmTitle', { name: change.name })}
          text={t('library.updateConfirmText', { from: change.from, to: change.to })}
          yes={t('library.downgradeConfirmYes')}
          onYes={() => answer(true)}
          onNo={() => answer(false)}
        />
      )}
      <Toasts />
    </div>
  )
}
