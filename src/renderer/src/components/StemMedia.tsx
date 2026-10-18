import type { SourceBook } from '@shared/ipc'
import type { ChoiceKey, Stem } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { BookFigure } from './BookFigure'
import { DataTable } from './DataTable'
import { altFor, type MarkBox } from './media'

export function StemMedia({
  stem,
  assetBase,
  book = null,
  marks,
  onMark
}: {
  stem: Stem
  assetBase: string
  book?: SourceBook | null
  marks?: MarkBox[]
  onMark?(key: ChoiceKey): void
}): React.JSX.Element | null {
  const image = stem.imageRef ?? stem.bolge
  if (!image && !stem.table) return null
  return (
    <div className="ql-stem-media">
      {image && (
        <BookFigure
          book={book}
          assetBase={assetBase}
          imageRef={stem.imageRef}
          bolge={stem.bolge}
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
