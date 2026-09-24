import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { tinykeys } from 'tinykeys'
import type { BankQuestion, BankRow, SourceBook } from '@shared/ipc'
import { BookButton } from '@renderer/components/BookButton'
import { BookViewer } from '@renderer/components/BookViewer'
import { Markdown } from '@renderer/components/Markdown'
import { Skeleton } from '@renderer/components/Skeleton'
import { Solution } from '@renderer/components/Solution'
import { t } from '@renderer/i18n'
import { useApp } from '@renderer/store/app'

type Filter = 'all' | 'flagged'

const ROW_H = 72

function fold(s: string): string {
  return s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '')
}

function Detail({ q, onBook }: { q: BankQuestion; onBook(): void }): React.JSX.Element {
  return (
    <div className="ql-bank-detail-body">
      <Markdown md={q.stem.md} assetBase={q.assetBase} />
      {q.stem.imageRef && (
        <img className="ql-stem-img" src={q.assetBase + q.stem.imageRef} alt="" />
      )}
      {q.choices.length > 0 && (
        <ol className="ql-bank-choices">
          {q.choices.map((c) => (
            <li key={c.key} className={c.key === q.correct ? 'ql-bank-correct' : ''}>
              <span className="tk-mono">{c.key}</span>
              <Markdown md={c.md} assetBase={q.assetBase} />
            </li>
          ))}
        </ol>
      )}
      {q.beklenenCevap && (
        <div>
          <span className="tk-label">{t('session.expected')}</span>
          <Markdown md={q.beklenenCevap} assetBase={q.assetBase} />
        </div>
      )}
      <Solution blocks={q.solution} assetBase={q.assetBase} />
      <blockquote className="ql-source">
        <span className="tk-label ql-source-label">{t('session.source')}</span>
        <p className="ql-source-quote">{q.source.quote}</p>
        <span className="tk-hint ql-source-line">
          {t('session.sourceFile', { file: q.source.file })}
          <span>
            {t('session.sourcePages', { from: q.source.pages[0], to: q.source.pages[1] })}
          </span>
        </span>
        <BookButton file={q.source.file} onOpen={onBook} />
      </blockquote>
    </div>
  )
}

export function Bank({
  moduleId,
  filter: initial
}: {
  moduleId: string
  filter?: Filter
}): React.JSX.Element {
  const go = useApp((s) => s.go)
  const toast = useApp((s) => s.toast)
  const modules = useApp((s) => s.modules)
  const loadModules = useApp((s) => s.loadModules)
  const [rows, setRows] = useState<BankRow[] | null>(null)
  const [filter, setFilter] = useState<Filter>(initial ?? 'all')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<BankQuestion | null>(null)
  const [reading, setReading] = useState(false)
  const [book, setBook] = useState<SourceBook | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let dead = false
    window.quizloop.source.book(moduleId).then(
      (b) => {
        if (!dead) setBook(b)
      },
      () => {
        if (!dead) setBook(null)
      }
    )
    return () => {
      dead = true
    }
  }, [moduleId])

  useEffect(() => {
    if (!modules) loadModules()
  }, [modules, loadModules])

  useEffect(() => {
    let dead = false
    window.quizloop.module.questions(moduleId).then((r) => {
      if (!dead) setRows(r)
    })
    return () => {
      dead = true
    }
  }, [moduleId])

  const visible = useMemo(() => {
    if (!rows) return []
    const q = fold(query.trim())
    return rows.filter(
      (r) =>
        (filter === 'all' || r.flagged) &&
        (!q || fold(r.stem).includes(q) || fold(r.chapter ?? '').includes(q))
    )
  }, [rows, filter, query])

  const flaggedCount = rows?.filter((r) => r.flagged).length ?? 0
  const name = modules?.find((m) => m.id === moduleId)?.name ?? moduleId

  const v = useVirtualizer({
    count: visible.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_H,
    overscan: 8
  })

  const at = useRef(0)
  const shown = useRef<BankRow[]>([])

  useEffect(() => {
    shown.current = visible
    const top = Math.max(0, visible.length - 1)
    if (at.current > top) {
      at.current = top
      setActive(top)
    }
  }, [visible])

  const move = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(shown.current.length - 1, i))
      at.current = next
      setActive(next)
      v.scrollToIndex(next, { align: 'auto' })
    },
    [v]
  )

  const pick = useCallback((i: number) => {
    at.current = i
    setActive(i)
  }, [])

  const current = visible[active]

  const show = useCallback(async () => {
    const row = shown.current[at.current]
    if (!row) return
    setOpen(await window.quizloop.module.question(moduleId, row.questionId))
  }, [moduleId])

  const toggleFlag = useCallback(async () => {
    const row = shown.current[at.current]
    if (!row) return
    const next = !row.flagged
    await window.quizloop.flags.set(moduleId, row.questionId, next)
    setRows(
      (rs) =>
        rs?.map((r) =>
          r.questionId === row.questionId ? { ...r, flagged: next, note: next ? r.note : null } : r
        ) ?? null
    )
    toast('success', next ? t('bank.flagged') : t('bank.unflagged'))
  }, [moduleId, toast])

  const exportFlags = async (): Promise<void> => {
    const r = await window.quizloop.flags.export(moduleId)
    if (r.ok) toast('success', t('bank.exported', { count: r.count ?? 0, path: r.path ?? '' }))
  }

  useEffect(() => {
    const page = (): number =>
      Math.max(1, Math.floor((listRef.current?.clientHeight ?? ROW_H * 8) / ROW_H) - 1)
    const to =
      (f: (i: number) => number) =>
      (e: KeyboardEvent): void => {
        e.preventDefault()
        move(f(at.current))
      }
    if (reading) return
    return tinykeys(window, {
      ArrowDown: to((i) => i + 1),
      ArrowUp: to((i) => i - 1),
      PageDown: to((i) => i + page()),
      PageUp: to((i) => i - page()),
      Home: to(() => 0),
      End: to(() => shown.current.length - 1),
      Enter: (e) => {
        if ((e.target as HTMLElement).closest('button')) return
        e.preventDefault()
        void show()
      },
      KeyF: (e) => {
        e.preventDefault()
        void toggleFlag()
      },
      Slash: (e) => {
        e.preventDefault()
        searchRef.current?.focus()
      },
      Escape: (e) => {
        e.preventDefault()
        if (open) setOpen(null)
        else go({ name: 'library' })
      }
    })
  }, [move, show, toggleFlag, open, go, reading])

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      listRef.current?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (query) setQuery('')
      else listRef.current?.focus()
    }
  }

  useEffect(() => {
    listRef.current?.focus()
  }, [rows])

  return (
    <section className="ql-screen ql-bank">
      <header className="ql-screen-head ql-transition-in">
        <div>
          <h2 className="tk-h2">{t('bank.title')}</h2>
          <p className="tk-hint">{name}</p>
        </div>
        <div className="ql-bank-tools">
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={() => go({ name: 'library' })}
          >
            {t('summary.back')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={exportFlags}
            disabled={flaggedCount === 0}
            title={flaggedCount === 0 ? t('bank.noneFlagged') : undefined}
          >
            {t('bank.export')}
          </button>
        </div>
      </header>

      <div className="ql-bank-bar ql-transition-in">
        <label className="ql-bank-search">
          <span className="tk-label">{t('bank.search')}</span>
          <input
            ref={searchRef}
            className="tk-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
          />
        </label>
        <div className="ql-segment" role="radiogroup" aria-label={t('bank.filter')}>
          {(['all', 'flagged'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              className={`tk-btn ql-btn-sm ${filter === f ? 'tk-btn-primary' : 'tk-btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'
                ? t('bank.all', { count: rows?.length ?? 0 })
                : t('bank.flaggedOnly', { count: flaggedCount })}
            </button>
          ))}
        </div>
      </div>

      {!rows && (
        <div className="tk-panel">
          <Skeleton lines={6} />
        </div>
      )}

      {rows && (
        <div className={`ql-bank-body ${open ? 'ql-bank-split' : ''}`}>
          <div
            ref={listRef}
            className="tk-panel ql-bank-list"
            role="listbox"
            tabIndex={0}
            aria-label={t('bank.title')}
            aria-activedescendant={current ? `ql-bank-${active}` : undefined}
          >
            {visible.length === 0 && (
              <p className="tk-hint ql-bank-empty">
                {filter === 'flagged' ? t('bank.noneFlagged') : t('bank.noMatch')}
              </p>
            )}
            <div
              className="ql-bank-canvas"
              style={{ '--ql-h': `${v.getTotalSize()}px` } as React.CSSProperties}
            >
              {v.getVirtualItems().map((item) => {
                const r = visible[item.index]
                if (!r) return null
                const on = item.index === active
                return (
                  <div
                    key={r.questionId}
                    id={`ql-bank-${item.index}`}
                    role="option"
                    aria-selected={on}
                    className={`ql-bank-row ${on ? 'ql-bank-row-active' : ''}`}
                    style={
                      {
                        '--ql-y': `${item.start}px`,
                        '--ql-row': `${ROW_H}px`
                      } as React.CSSProperties
                    }
                    onClick={() => pick(item.index)}
                    onDoubleClick={() => {
                      pick(item.index)
                      void window.quizloop.module.question(moduleId, r.questionId).then(setOpen)
                    }}
                  >
                    <span className="ql-bank-stem">{r.stem}</span>
                    <span className="ql-bank-meta tk-hint">
                      <span className={`ql-dot ql-dot-${r.status}`} />
                      <span>{t(`bank.status.${r.status}`)}</span>
                      <span>{r.chapter ?? t('chapters.unsorted')}</span>
                      <span>{t(`bank.kind.${r.kind}`)}</span>
                      <span>{t(`bank.diff.${r.difficulty as 'kolay'}`)}</span>
                      {r.flagged && <span className="ql-bank-flag">{t('bank.flag')}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          {open && (
            <aside className="tk-panel ql-bank-detail" aria-label={t('bank.detail')}>
              <header className="ql-bank-detail-head">
                <span className="tk-label">{current?.chapter ?? ''}</span>
                <button
                  type="button"
                  className="tk-btn tk-btn-ghost ql-btn-sm"
                  onClick={() => setOpen(null)}
                >
                  {t('book.close')}
                </button>
              </header>
              <Detail q={open} onBook={() => setReading(true)} />
            </aside>
          )}
        </div>
      )}

      <p className="tk-hint ql-keys">
        {(
          [
            ['↑ ↓', 'bank.hint.move'],
            ['↵', 'bank.hint.open'],
            ['F', 'bank.hint.flag'],
            ['/', 'bank.hint.search'],
            ['Esc', 'bank.hint.back']
          ] as const
        ).map(([k, key]) => (
          <span key={k} className="ql-key">
            <kbd>{k}</kbd>
            <span className="ql-key-label">{t(key)}</span>
          </span>
        ))}
      </p>
      {reading && open && (
        <BookViewer
          key={book?.path ?? 'kesit'}
          book={book}
          moduleId={moduleId}
          source={open.source}
          assetBase={open.assetBase}
          onBook={setBook}
          onClose={() => setReading(false)}
        />
      )}
    </section>
  )
}
