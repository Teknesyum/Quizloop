import type { SolutionBlock } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { DataTable } from './DataTable'
import { Figure } from './Figure'
import { Markdown } from './Markdown'
import { altFor } from './media'

function Block({ b, assetBase }: { b: SolutionBlock; assetBase: string }): React.JSX.Element {
  if (b.type === 'text') return <Markdown md={b.md} assetBase={assetBase} />
  if (b.type === 'hint')
    return <Markdown md={b.md} assetBase={assetBase} className="tk-prose ql-hint-block" />
  if (b.type === 'formula') return <Markdown md={`$$${b.tex}$$`} />
  if (b.type === 'image')
    return (
      <Figure
        src={assetBase + b.ref}
        alt={altFor(b.alt, b.caption, t('media.solutionAlt'))}
        caption={b.caption}
      />
    )
  return <DataTable table={b} />
}

export function Solution({
  blocks,
  assetBase
}: {
  blocks: SolutionBlock[]
  assetBase: string
}): React.JSX.Element {
  return (
    <div className="ql-solution">
      {blocks.map((b, i) => (
        <div key={i} className="ql-transition-in" style={{ '--ql-i': i } as React.CSSProperties}>
          <Block b={b} assetBase={assetBase} />
        </div>
      ))}
    </div>
  )
}
