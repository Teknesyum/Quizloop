import { useState } from 'react'

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
  const [failed, setFailed] = useState(false)
  if (src && !failed)
    return (
      <img
        className={`ql-cover ${foot ? 'ql-cover-foot' : ''}`}
        src={src}
        alt=""
        onError={() => setFailed(true)}
      />
    )
  return (
    <span className="tk-mono ql-cover ql-cover-none" aria-hidden="true">
      {initials(name)}
    </span>
  )
}
