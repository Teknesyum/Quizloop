import { bookLocative } from '@shared/kaynak'
import { t } from '@renderer/i18n'

export function BookButton({ file, onOpen }: { file: string; onOpen(): void }): React.JSX.Element {
  const yer = bookLocative(file)
  return (
    <button
      type="button"
      className="tk-btn tk-btn-ghost ql-btn-sm ql-book-open"
      onClick={onOpen}
      title={t('book.open')}
    >
      {yer ? t('book.show', { yer }) : t('book.showAny')}
    </button>
  )
}
