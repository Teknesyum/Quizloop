import { useState } from 'react'
import { useApp } from '@renderer/store/app'

function initials(name: string): string {
  const no = name.match(/^\s*(\d+)/)
  if (no?.[1]) return no[1]
  const [a = '', b = ''] = name.split(/\s+/).filter(Boolean)
  return (a.charAt(0) + b.charAt(0)).toLocaleUpperCase('tr')
}

export function CardCover({
  src,
  name,
  foot = false
}: {
  src: string | null
  name: string
  foot?: boolean
}): React.JSX.Element {
  const fresh = useApp((s) => s.fresh)
  const [failed, setFailed] = useState<string | null>(null)
  const url = src && fresh ? `${src}?v=${fresh}` : src
  if (url && failed !== url)
    return (
      <img
        className={`ql-cover ${foot ? 'ql-cover-foot' : ''}`}
        src={url}
        alt=""
        onError={() => setFailed(url)}
      />
    )
  return (
    <span className="tk-mono ql-cover ql-cover-none" aria-hidden="true">
      {initials(name)}
    </span>
  )
}
