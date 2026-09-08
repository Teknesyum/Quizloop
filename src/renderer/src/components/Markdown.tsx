import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface Props {
  md: string
  assetBase?: string
  className?: string
}

export function Markdown({ md, assetBase = '', className }: Props): React.JSX.Element {
  return (
    <div className={className ?? 'tk-prose'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={(url) => (url.startsWith('assets/') ? assetBase + url : url)}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          )
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
}
