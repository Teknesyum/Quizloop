import { ScaleSwitch } from '../../../../teknesyum-ui/ustcubuk/ScaleSwitch'
import { LangSwitch } from '../../../../teknesyum-ui/ustcubuk/TitleBar'
import { FONT_SCALES } from '@shared/ipc'
import { CardMenu, MenuItem } from '@renderer/components/CardMenu'
import { t, type Lang } from '@renderer/i18n'
import { scaleLabels } from '@renderer/scale'
import { useApp } from '@renderer/store/app'

export function TopMenu({
  scale,
  lang,
  links,
  onScale,
  onLang
}: {
  scale: number
  lang: Lang
  links: { brand: string; sponsor: string }
  onScale(next: number): void
  onLang(next: Lang): void
}): React.JSX.Element {
  const toast = useApp((s) => s.toast)
  const share = async (): Promise<void> => {
    try {
      const r = await window.quizloop.app.share(t('settings.shareText'))
      if (r === 'copied') toast('success', t('settings.shareCopied'))
    } catch {
      toast('danger', t('settings.shareFailed'))
    }
  }
  return (
    <CardMenu label={t('library.more')}>
      <div className="ql-menu-row ql-transition-in" onClick={(e) => e.stopPropagation()}>
        <span className="tk-hint">{t('scale.label')}</span>
        <ScaleSwitch scale={scale} steps={FONT_SCALES} labels={scaleLabels()} onChange={onScale} />
      </div>
      <div className="ql-menu-row" onClick={(e) => e.stopPropagation()}>
        <span className="tk-hint">{t('lang.label')}</span>
        <LangSwitch lang={lang} label={t('lang.label')} onChange={onLang} />
      </div>
      <MenuItem onPick={() => void share()}>{t('settings.shareOpen')}</MenuItem>
      <MenuItem onPick={() => window.quizloop.app.openContact()}>
        {t('settings.contactOpen')}
      </MenuItem>
      <a
        className="ql-menu-opt"
        role="menuitem"
        href={links.sponsor}
        target="_blank"
        rel="noreferrer"
        title={t('sig.supportTitle')}
      >
        {t('sig.support')}
      </a>
      <a
        className="ql-menu-opt"
        role="menuitem"
        href={links.brand}
        target="_blank"
        rel="noreferrer"
        title={t('sig.brandTitle')}
      >
        {t('sig.brand')}
      </a>
    </CardMenu>
  )
}
