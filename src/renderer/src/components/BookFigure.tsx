import { useEffect, useState } from 'react'
import type { SourceBook } from '@shared/ipc'
import { t } from '@renderer/i18n'
import { Figure } from './Figure'
import { Skeleton } from './Skeleton'
import { regionUrl, type Region } from './region'

function useImageSrc(
  book: SourceBook | null,
  assetBase: string,
  ref: string | undefined,
  bolge: Region | undefined
): { src: string | null; failed: boolean } {
  const [drawn, setDrawn] = useState<{ key: string; src: string | null; failed: boolean }>({
    key: '',
    src: null,
    failed: false
  })
  const key = bolge ? `${bolge.pdfSayfa}:${bolge.bbox.join(',')}` : ''
  const pending = ref ? null : bolge ? regionUrl(book, bolge) : null
  useEffect(() => {
    if (!pending) return
    let dead = false
    pending.then(
      (src) => {
        if (!dead) setDrawn({ key, src, failed: false })
      },
      () => {
        if (!dead) setDrawn({ key, src: null, failed: true })
      }
    )
    return () => {
      dead = true
    }
  }, [pending, key])
  if (ref) return { src: assetBase + ref, failed: false }
  if (!bolge || !pending) return { src: null, failed: Boolean(bolge) && book !== null }
  return drawn.key === key ? { src: drawn.src, failed: drawn.failed } : { src: null, failed: false }
}

export function BookFigure({
  book,
  assetBase,
  imageRef,
  bolge,
  ...rest
}: Omit<React.ComponentProps<typeof Figure>, 'src'> & {
  book: SourceBook | null
  assetBase: string
  imageRef?: string
  bolge?: Region
}): React.JSX.Element | null {
  const { src, failed } = useImageSrc(book, assetBase, imageRef, bolge)
  if (src) return <Figure src={src} {...rest} />
  if (failed && bolge)
    return (
      <p className="tk-hint">
        {t('book.pageMissing', { page: bolge.pdfSayfa - (book?.sayfaOfseti ?? 0) })}
      </p>
    )
  if (!bolge) return null
  return <Skeleton lines={4} />
}

export function ChoiceImage({
  book,
  assetBase,
  imageRef,
  bolge,
  alt
}: {
  book: SourceBook | null
  assetBase: string
  imageRef?: string
  bolge?: Region
  alt: string
}): React.JSX.Element | null {
  const { src } = useImageSrc(book, assetBase, imageRef, bolge)
  if (!src) return null
  return <img src={src} alt={alt} className="ql-choice-img" />
}
