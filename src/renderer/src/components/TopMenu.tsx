import { LangSwitch } from '../../../../teknesyum-ui/ustcubuk/TitleBar'
import { CardMenu } from '@renderer/components/CardMenu'
import { t, type Lang } from '@renderer/i18n'
import { nextScale } from '@renderer/scale'

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
  const down = nextScale(scale, -1)
  const up = nextScale(scale, 1)
  return (
    <CardMenu label={t('library.more')}>
      <div className="ql-menu-row ql-transition-in" onClick={(e) => e.stopPropagation()}>
        <span className="tk-hint">{t('scale.label')}</span>
        <div className="ql-scale" role="group" aria-label={t('scale.label')}>
          <button
            type="button"
            className="ql-scale__btn"
            aria-label={t('scale.down')}
            title={t('scale.down')}
            disabled={down === scale}
            onClick={() => onScale(down)}
          >
            −
          </button>
          <button
            type="button"
            className="ql-scale__btn ql-scale__value"
            title={t('scale.reset')}
            disabled={scale === 1}
            onClick={() => onScale(1)}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="ql-scale__btn"
            aria-label={t('scale.up')}
            title={t('scale.up')}
            disabled={up === scale}
            onClick={() => onScale(up)}
          >
            +
          </button>
        </div>
      </div>
      <div className="ql-menu-row" onClick={(e) => e.stopPropagation()}>
        <span className="tk-hint">{t('lang.label')}</span>
        <LangSwitch lang={lang} label={t('lang.label')} onChange={onLang} />
      </div>
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
