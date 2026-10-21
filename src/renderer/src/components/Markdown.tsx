import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

const CASE = /^(\d{1,3})([EK])(?=[-–/\s]|$)/

function caseHead(children: React.ReactNode): React.ReactNode {
  if (typeof children !== 'string') return children
  const m = children.match(CASE)
  if (!m) return children
  return (
    <>
      {m[1]}
      <span className={m[2] === 'E' ? 'ql-case-e' : 'ql-case-k'}>{m[2]}</span>
      {children.slice(m[0].length)}
    </>
  )
}

interface Props {
  md: string
  assetBase?: string
  className?: string
}

function MarkdownView({ md, assetBase = '', className }: Props): React.JSX.Element {
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
          ),
          strong: ({ children }) => <strong>{caseHead(children)}</strong>,
          p: ({ children }) => <p dir="auto">{children}</p>,
          li: ({ children }) => <li dir="auto">{children}</li>
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
}

export const Markdown = memo(MarkdownView)
