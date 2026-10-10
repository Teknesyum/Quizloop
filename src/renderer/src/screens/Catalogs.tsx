import { useEffect, useId, useState } from 'react'
import {
  CONTACT_URL,
  type CatalogChannelView,
  type CatalogRead,
  type CatalogSetting,
  type CatalogView
} from '@shared/ipc'
import { catalogAddress, catalogOf } from '@shared/catalog'
import { Confirm } from '@renderer/components/Confirm'
import { Skeleton } from '@renderer/components/Skeleton'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { faultText, sizeText } from '@renderer/catalog'

function Channel({
  c,
  subscribed,
  elsewhere,
  installed,
  busy,
  index,
  onToggle
}: {
  c: CatalogChannelView
  subscribed: boolean
  elsewhere: boolean
  installed: string | null
  busy: boolean
  index: number
  onToggle(): void
}): React.JSX.Element {
  const facts = [
    t('library.card.version', { version: c.version }),
    c.questionCount === null ? null : t('catalog.questions', { count: c.questionCount }),
    sizeText(c.size),
    installed === null ? null : t('catalog.installed', { version: installed })
  ].filter(Boolean)
  return (
    <li
      className="ql-catalog-channel ql-transition-in"
      style={{ '--ql-i': index } as React.CSSProperties}
    >
      <div className="ql-catalog-what">
        <p className="ql-catalog-name">{c.name}</p>
        <p className="tk-hint tk-mono">{facts.join(' · ')}</p>
        {c.description && <p className="tk-hint">{c.description}</p>}
      </div>
      <button
        type="button"
        className={`tk-btn ql-btn-sm ${subscribed ? 'tk-btn-ghost' : 'tk-btn-primary'}`}
        disabled={busy || (elsewhere && !subscribed)}
        aria-pressed={subscribed}
        title={
          busy
            ? t('common.loading')
            : elsewhere && !subscribed
              ? t('catalog.elsewhere')
              : t(subscribed ? 'catalog.unsubscribeHelp' : 'catalog.subscribeHelp')
        }
        onClick={onToggle}
      >
        {busy
          ? t('catalog.downloading')
          : t(subscribed ? 'catalog.unsubscribe' : 'catalog.subscribe')}
      </button>
    </li>
  )
}

export function Catalogs(): React.JSX.Element {
  const id = useId()
  const go = useApp((s) => s.go)
  const toast = useApp((s) => s.toast)
  const settings = useApp((s) => s.settings)
  const saveSettings = useApp((s) => s.saveSettings)
  const modules = useApp((s) => s.modules)
  const loadModules = useApp((s) => s.loadModules)
  const catalogs = settings?.catalogs ?? []
  const [views, setViews] = useState<Record<string, CatalogRead>>({})
  const [address, setAddress] = useState('')
  const [opening, setOpening] = useState(false)
  const [offer, setOffer] = useState<CatalogView | null>(null)
  const [leaving, setLeaving] = useState<CatalogSetting | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    loadModules()
  }, [loadModules])

  const urls = catalogs.map((s) => s.url).join('\n')
  useEffect(() => {
    let live = true
    for (const url of urls ? urls.split('\n') : [])
      void window.quizloop.catalog.read(url).then((r) => {
        if (live) setViews((v) => ({ ...v, [url]: r }))
      })
    return () => {
      live = false
    }
  }, [urls, round])

  const open = async (): Promise<void> => {
    if (!address.trim() || opening) return
    setOpening(true)
    try {
      const r = await window.quizloop.catalog.read(address)
      if (!r.ok || !r.catalog) toast('danger', faultText(r.fault))
      else if (catalogs.some((s) => s.url === r.catalog?.url)) toast('warning', t('catalog.exists'))
      else setOffer(r.catalog)
    } finally {
      setOpening(false)
    }
  }

  const add = async (v: CatalogView): Promise<void> => {
    await saveSettings({
      catalogs: [...catalogs, { url: v.url, name: v.name, publisher: v.publisher, channels: [] }]
    })
    setViews((all) => ({ ...all, [v.url]: { ok: true, catalog: v } }))
    setOffer(null)
    setAddress('')
    toast('success', t('catalog.added', { name: v.name }))
  }

  const setChannels = (url: string, channels: string[]): Promise<void> =>
    saveSettings({
      catalogs: (useApp.getState().settings?.catalogs ?? []).map((s) =>
        s.url === url ? { ...s, channels } : s
      )
    })

  const toggle = async (s: CatalogSetting, c: CatalogChannelView): Promise<void> => {
    if (s.channels.includes(c.id)) {
      await setChannels(
        s.url,
        s.channels.filter((x) => x !== c.id)
      )
      toast('success', t('catalog.unsubscribed', { name: c.name }))
      return
    }
    setBusy(`${s.url}#${c.id}`)
    try {
      const r = await window.quizloop.catalog.install(s.url, c.id)
      if (r.cancelled) return
      if (!r.ok) {
        toast('danger', `${t('library.installFailed')}: ${faultText(r.error)}`)
        return
      }
      await setChannels(s.url, [...s.channels, c.id])
      await loadModules()
      toast('success', t('catalog.subscribed', { name: c.name }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('catalog.title')}</h2>
          <p className="tk-hint">{t('catalog.subtitle')}</p>
        </div>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-sm"
          onClick={() => go({ name: 'library' })}
        >
          {t('summary.back')}
        </button>
      </header>

      <form
        className="tk-panel ql-catalog-form ql-transition-in"
        onSubmit={(e) => {
          e.preventDefault()
          void open()
        }}
      >
        <div className="tk-field">
          <label className="tk-label" htmlFor={`${id}-address`}>
            {t('catalog.address')}
          </label>
          <div className="ql-dir-row">
            <input
              id={`${id}-address`}
              className="tk-input tk-mono ql-dir-value"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={2000}
              value={address}
              aria-invalid={address.trim() !== '' && catalogAddress(address) === null}
              aria-describedby={`${id}-address-hint`}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              type="submit"
              className="tk-btn tk-btn-primary"
              disabled={opening || !address.trim()}
              title={opening ? t('common.loading') : t('catalog.openHelp')}
            >
              {t(opening ? 'catalog.opening' : 'catalog.open')}
            </button>
          </div>
          <span className="tk-hint" id={`${id}-address-hint`}>
            {t('catalog.addressHelp')}
          </span>
        </div>
      </form>

      {settings !== null && catalogs.length === 0 && (
        <div className="tk-panel ql-empty ql-transition-in">
          <h3 className="tk-h3">
            <span>{t('catalog.none.title')}</span>
          </h3>
          <p className="tk-prose">{t('catalog.none.body')}</p>
        </div>
      )}

      {catalogs.map((s, i) => {
        const read = views[s.url]
        const v = read?.ok ? read.catalog : undefined
        return (
          <article
            key={s.url}
            className="tk-panel ql-catalog ql-transition-in"
            style={{ '--ql-i': i + 1 } as React.CSSProperties}
            aria-label={s.name}
          >
            <header className="ql-catalog-head">
              <div className="ql-catalog-what">
                <h3 className="tk-h3">{v?.name ?? s.name}</h3>
                <p className="tk-hint">
                  {t('catalog.publisher', { publisher: v?.publisher ?? s.publisher })}
                </p>
                <p className="tk-hint tk-mono ql-catalog-url">{s.url}</p>
                {v?.contact && (
                  <p className="tk-hint">{t('catalog.contact', { contact: v.contact })}</p>
                )}
              </div>
              <button
                type="button"
                className="tk-btn tk-btn-ghost ql-btn-sm"
                onClick={() => setLeaving(s)}
              >
                {t('catalog.remove')}
              </button>
            </header>

            {read === undefined && <Skeleton lines={2} />}

            {read && !read.ok && (
              <div className="ql-row">
                <p className="tk-hint ql-failed-detail">{faultText(read.fault)}</p>
                <button
                  type="button"
                  className="tk-btn tk-btn-ghost ql-btn-sm"
                  onClick={() => {
                    setViews((all) =>
                      Object.fromEntries(Object.entries(all).filter(([url]) => url !== s.url))
                    )
                    setRound((n) => n + 1)
                  }}
                >
                  {t('catalog.retry')}
                </button>
              </div>
            )}

            {v && v.channels.length === 0 && <p className="tk-hint">{t('catalog.empty')}</p>}

            {v && v.channels.length > 0 && (
              <ul className="ql-catalog-channels">
                {v.channels.map((c, n) => {
                  const owner = catalogOf(catalogs, c.id)
                  return (
                    <Channel
                      key={c.id}
                      c={c}
                      index={n}
                      subscribed={s.channels.includes(c.id)}
                      elsewhere={owner !== undefined && owner.url !== s.url}
                      installed={modules?.find((m) => m.id === c.id)?.version ?? null}
                      busy={busy === `${s.url}#${c.id}`}
                      onToggle={() => void toggle(s, c)}
                    />
                  )
                })}
              </ul>
            )}
          </article>
        )
      })}

      <div className="ql-row ql-transition-in">
        <span className="tk-hint">{t('catalog.report')}</span>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-sm"
          title={CONTACT_URL}
          onClick={() => window.quizloop.app.openContact()}
        >
          {t('settings.contactOpen')}
        </button>
      </div>

      {offer && (
        <Confirm
          title={t('catalog.warnTitle')}
          text={t('catalog.warnText', {
            name: offer.name,
            publisher: offer.publisher,
            url: offer.url
          })}
          yes={t('catalog.warnYes')}
          onNo={() => setOffer(null)}
          onYes={() => add(offer)}
        />
      )}

      {leaving && (
        <Confirm
          title={t('catalog.removeTitle', { name: leaving.name })}
          text={t('catalog.removeText')}
          yes={t('catalog.remove')}
          danger
          onNo={() => setLeaving(null)}
          onYes={async () => {
            await saveSettings({ catalogs: catalogs.filter((s) => s.url !== leaving.url) })
            setLeaving(null)
          }}
        />
      )}
    </section>
  )
}
