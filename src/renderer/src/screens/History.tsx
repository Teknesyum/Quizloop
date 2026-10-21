import { useCallback, useEffect, useState } from 'react'
import { HISTORY_PAGE, type BankQuestion, type HistoryItem } from '@shared/ipc'
import { ago } from '@renderer/ago'
import { Skeleton } from '@renderer/components/Skeleton'
import { lang, t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'
import { Detail } from './Bank'

function answerLine(h: HistoryItem): string {
  if (h.kind === 'acik-uclu') return t('history.openEnded')
  if (!h.answer) return t('history.noAnswer')
  const own = t('history.answer', { key: h.answer })
  return h.correct || !h.correctKey
    ? own
    : `${own} · ${t('history.correctKey', { key: h.correctKey })}`
}

function Row({
  h,
  open,
  q,
  onToggle
}: {
  h: HistoryItem
  open: boolean
  q: BankQuestion | null | undefined
  onToggle(): void
}): React.JSX.Element {
  const at = new Date(h.ts)
  return (
    <li className={`tk-panel ql-history-item ${open ? 'ql-history-open' : ''}`}>
      <button type="button" className="ql-history-row" aria-expanded={open} onClick={onToggle}>
        <span className="ql-history-stem">{h.stem}</span>
        <span className="ql-history-meta tk-hint">
          <span
            className={`ql-history-mark ${h.correct ? 'ql-history-right' : 'ql-history-wrong'}`}
          >
            {t(h.correct ? 'history.right' : 'history.wrong')}
          </span>
          <span>{answerLine(h)}</span>
          <span>{h.moduleName}</span>
          <span className="tk-mono" title={at.toLocaleString(lang)}>
            {ago(h.ts)}
          </span>
        </span>
      </button>
      {open && q === undefined && <Skeleton lines={3} />}
      {open && q === null && <p className="tk-hint">{t('history.missing')}</p>}
      {open && q && (
        <div className="ql-history-detail">
          <Detail q={q} kitap={false} book={null} onBook={() => undefined} />
        </div>
      )}
    </li>
  )
}

export function History(): React.JSX.Element {
  const go = useApp((s) => s.go)
  const toast = useApp((s) => s.toast)
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Record<number, BankQuestion | null>>({})

  const load = useCallback(
    async (offset: number): Promise<void> => {
      setBusy(true)
      try {
        const page = await window.quizloop.history.page(offset, HISTORY_PAGE)
        setTotal(page.total)
        setItems((prev) => [...(prev ?? []), ...page.items])
      } catch (e) {
        toast('danger', `${t('common.error')}: ${String(e)}`)
        setItems((prev) => prev ?? [])
      } finally {
        setBusy(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    let dead = false
    window.quizloop.history.page(0, HISTORY_PAGE).then(
      (page) => {
        if (dead) return
        setTotal(page.total)
        setItems(page.items)
      },
      (e: unknown) => {
        if (dead) return
        toast('danger', `${t('common.error')}: ${String(e)}`)
        setItems([])
      }
    )
    return () => {
      dead = true
    }
  }, [toast])

  const toggle = async (h: HistoryItem): Promise<void> => {
    if (open === h.id) {
      setOpen(null)
      return
    }
    setOpen(h.id)
    if (h.id in questions) return
    try {
      const q = await window.quizloop.module.question(h.moduleId, h.questionId)
      setQuestions((m) => ({ ...m, [h.id]: q }))
    } catch {
      setQuestions((m) => ({ ...m, [h.id]: null }))
    }
  }

  return (
    <section className="ql-screen">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('history.title')}</h2>
          <p className="tk-hint">
            {items ? t('history.count', { shown: items.length, total }) : t('history.subtitle')}
          </p>
        </div>
        <button
          type="button"
          className="tk-btn tk-btn-ghost ql-btn-sm"
          onClick={() => go({ name: 'library' })}
        >
          {t('summary.back')}
        </button>
      </header>

      {items === null && (
        <div className="tk-panel">
          <Skeleton lines={6} />
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="tk-panel ql-empty ql-transition-in">
          <p className="tk-prose">{t('history.empty')}</p>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <ol className="ql-history">
          {items.map((h) => (
            <Row
              key={h.id}
              h={h}
              open={open === h.id}
              q={questions[h.id]}
              onToggle={() => void toggle(h)}
            />
          ))}
        </ol>
      )}

      {items !== null && items.length < total && (
        <div className="ql-row ql-history-more">
          <button
            type="button"
            className="tk-btn tk-btn-ghost"
            disabled={busy}
            title={busy ? t('common.loading') : undefined}
            onClick={() => void load(items.length)}
          >
            {t('history.more')}
          </button>
        </div>
      )}
    </section>
  )
}
