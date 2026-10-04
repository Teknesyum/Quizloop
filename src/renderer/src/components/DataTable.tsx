import { useId, useMemo } from 'react'
import type { Table } from '@shared/schema/question'
import { t } from '@renderer/i18n'
import { tableModel } from './media'

export function DataTable({
  table,
  className
}: {
  table: Table
  className?: string
}): React.JSX.Element {
  const id = useId()
  const m = useMemo(() => tableModel(table), [table])
  return (
    <div
      className={`ql-table-wrap ${className ?? ''}`}
      role="region"
      tabIndex={0}
      aria-labelledby={table.caption ? id : undefined}
      aria-label={table.caption ? undefined : t('media.table')}
    >
      <table className="ql-table">
        {table.caption && (
          <caption id={id} className="tk-hint ql-table-caption">
            {table.caption}
          </caption>
        )}
        {m.header.some((h) => h.trim()) && (
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
          {m.rows.map((r, j) => (
            <tr key={j} className="ql-transition-in" style={{ '--ql-i': j } as React.CSSProperties}>
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
    </div>
  )
}
