import type { SourceBook } from '@shared/ipc'

export function kitapta(book: SourceBook | null, file: string): boolean {
  return book?.available === true && (!book.file || book.file === file)
}

export function kodGoster(tags: string[]): boolean {
  return tags.includes('kod')
}

export function kaynakGoster(tags: string[]): boolean {
  return !tags.includes('kol:anlam-tanima') && !kodGoster(tags)
}
