import { bookLocative } from '@shared/kaynak'
import { t } from '@renderer/i18n'

export function bookLabel(file: string): string {
  const yer = bookLocative(file)
  return yer ? t('book.show', { yer }) : t('book.showAny')
}
