import { useId, useMemo } from 'react'
import type { Table } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { tableModel, tableParts } from './media'

export function DataTable({
  table,
  className
}: {
  table: Table
  className?: string
}): React.JSX.Element {
  const id = useId()
  const m = useMemo(() => tableModel(table), [table])
  const parts = useMemo(() => tableParts(m.rows, m.header.length), [m])
  const headed = m.header.some((h) => h.trim())
  return (
    <div
      className={`ql-table-wrap ${className ?? ''}`}
      role="region"
      tabIndex={0}
      aria-labelledby={table.caption ? id : undefined}
      aria-label={table.caption ? undefined : t('media.table')}
    >
      {parts.map((rows, p) => (
        <table key={p} className="ql-table">
          {headed && (
            <thead>
              <tr>
                {m.header.map((h, j) => (
                  <th key={j} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((r, j) => (
              <tr
                key={j}
                className="ql-transition-in"
                style={{ '--ql-i': j } as React.CSSProperties}
              >
                {r.head !== null && <th scope="row">{r.head}</th>}
                {r.cells.map((c, k) => (
                  <td key={k} dir="auto">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      {table.caption && (
        <p id={id} className="tk-hint ql-table-caption">
          {table.caption}
        </p>
      )}
    </div>
  )
}
