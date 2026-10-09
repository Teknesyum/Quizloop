import { bookLabel } from '@renderer/components/bookLabel'
import { t } from '@renderer/i18n'

export function BookButton({ file, onOpen }: { file: string; onOpen(): void }): React.JSX.Element {
  return (
    <button
      type="button"
      className="tk-btn tk-btn-ghost ql-btn-sm ql-book-open"
      onClick={onOpen}
      title={t('book.open')}
    >
      {bookLabel(file)}
    </button>
  )
}
