import type { SolutionBlock } from '@shared/schema/question'
import { Markdown } from './Markdown'

export function Solution({
  blocks,
  assetBase
}: {
  blocks: SolutionBlock[]
  assetBase: string
}): React.JSX.Element {
  return (
    <div className="ql-solution">
      {blocks.map((b, i) => {
        if (b.type === 'text') return <Markdown key={i} md={b.md} assetBase={assetBase} />
        if (b.type === 'hint')
          return (
            <Markdown key={i} md={b.md} assetBase={assetBase} className="tk-prose ql-hint-block" />
          )
        if (b.type === 'formula') return <Markdown key={i} md={`$$${b.tex}$$`} />
        if (b.type === 'image')
          return (
            <figure key={i} className="ql-figure">
              <img src={assetBase + b.ref} alt={b.caption ?? ''} />
              {b.caption && <figcaption className="tk-hint">{b.caption}</figcaption>}
            </figure>
          )
        return (
          <figure key={i} className="ql-figure">
            <table className="ql-table">
              <thead>
                <tr>
                  {b.header.map((h, j) => (
                    <th key={j}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {b.caption && <figcaption className="tk-hint">{b.caption}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}
