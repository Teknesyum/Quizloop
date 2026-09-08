interface Props {
  lines?: number
  className?: string
}

export function Skeleton({ lines = 3, className }: Props): React.JSX.Element {
  return (
    <div className={`ql-skeleton ${className ?? ''}`} aria-busy="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="ql-skeleton-line" style={{ width: `${100 - (i % 3) * 18}%` }} />
      ))}
    </div>
  )
}
