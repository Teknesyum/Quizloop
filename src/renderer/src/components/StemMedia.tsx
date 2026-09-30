import type { ChoiceKey, Stem } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { DataTable } from './DataTable'
import { Figure } from './Figure'
import { altFor, type MarkBox } from './media'

export function StemMedia({
  stem,
  assetBase,
  marks,
  onMark
}: {
  stem: Stem
  assetBase: string
  marks?: MarkBox[]
  onMark?(key: ChoiceKey): void
}): React.JSX.Element | null {
  if (!stem.imageRef && !stem.table) return null
  return (
    <div className="ql-stem-media">
      {stem.imageRef && (
        <Figure
          src={assetBase + stem.imageRef}
          alt={altFor(stem.alt, stem.md, t('media.imageAlt'))}
          masks={stem.masks}
          marks={marks}
          onMark={onMark}
          className={marks?.length ? 'ql-media-mark' : undefined}
        />
      )}
      {stem.table && <DataTable table={stem.table} />}
    </div>
  )
}
