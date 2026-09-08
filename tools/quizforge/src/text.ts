import { quoteInText } from '../../../src/shared/text.ts'

export function dehyphen(s: string): string {
  return s.replace(/(\p{L})-\s+(\p{L})/gu, '$1$2')
}

export function quoteFound(quote: string, text: string): boolean {
  return quoteInText(quote, text) || quoteInText(dehyphen(quote), dehyphen(text))
}
