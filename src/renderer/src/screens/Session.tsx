import { useEffect, useMemo, useState } from 'react'
import { tinykeys } from 'tinykeys'
import type { QuestionView, SelfAssess } from '@shared/ipc'
import type { ChoiceKey, SolutionBlock } from '@shared/schema/question'
import { Confirm } from '@renderer/components/Confirm'
import { Markdown } from '@renderer/components/Markdown'
import { Skeleton } from '@renderer/components/Skeleton'
import { useTyper } from '@renderer/hooks/useTyper'
import { t, type Key } from '@renderer/i18n'
import { KEYS } from '@renderer/keys'
import { useApp } from '@renderer/store/app'
import { useSession } from '@renderer/store/session'
import { Summary } from './Summary'

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function emphasize(md: string, tags: string[]): string {
  let out = md
  const seen = new Set<string>()
  tags.forEach((tag, i) => {
    const term = tag.trim()
    if (term.length < 4 || seen.has(term.toLocaleLowerCase('tr'))) return
    seen.add(term.toLocaleLowerCase('tr'))
    const mark = i % 2 === 0 ? '**' : '*'
    out = out.replace(
      new RegExp(`(?<![\\p{L}*])(${escapeRe(term)})(?![\\p{L}*])`, 'giu'),
      `${mark}$1${mark}`
    )
  })
  return out
}

function splitAsk(md: string): { body: string; ask: string } {
  const m = md.match(/(?:^|(?<=[.!?]\s))([^.!?]*\?)\s*$/)
  if (!m || m.index === undefined) return { body: md, ask: '' }
  const body = md.slice(0, m.index).trim()
  if (!body) return { body: md, ask: '' }
  return { body, ask: (m[1] ?? '').trim() }
}

function Stem({
  q,
  speed
}: {
  q: QuestionView
  speed: 'slow' | 'normal' | 'fast' | 'off'
}): React.JSX.Element {
  const full = useMemo(() => {
    const { body, ask } = splitAsk(q.stem.md)
    const marked = emphasize(body, q.tags)
    return { body: marked, ask, text: ask ? marked + '\n' + ask : marked }
  }, [q.questionId])
  const { shown, done, skip } = useTyper(full.text, speed)
  const cut = shown.length
  const bodyShown = shown.slice(0, Math.min(cut, full.body.length))
  const askShown = cut > full.body.length ? shown.slice(full.body.length + 1) : ''
  return (
    <div className={`ql-stem ${done ? '' : 'ql-typing'}`} onClick={skip}>
      <Markdown md={bodyShown} assetBase={q.assetBase} className="tk-prose ql-stem-text" />
      {full.ask && askShown && (
        <Markdown md={askShown} assetBase={q.assetBase} className="tk-prose ql-stem-ask" />
      )}
      {q.stem.imageRef && (
        <img className="ql-stem-img" src={q.assetBase + q.stem.imageRef} alt="" />
      )}
    </div>
  )
}

function Solution({
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

function whenLabel(iso: string): string {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  if (diff < 3600000) return d.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('tr', { day: '2-digit', month: 'short' })
}

export function Session({
  moduleId,
  chapter
}: {
  moduleId: string
  chapter: string | null
}): React.JSX.Element {
  const s = useSession()
  const settings = useApp((x) => x.settings)
  const go = useApp((x) => x.go)
  const toast = useApp((x) => x.toast)
  const loadModules = useApp((x) => x.loadModules)
  const [ending, setEnding] = useState(false)
  const speed = settings?.typerSpeed ?? 'normal'
  const state = s.state

  useEffect(() => {
    s.start(moduleId, chapter)
    return () => s.reset()
  }, [moduleId, chapter])

  const flag = async (): Promise<void> => {
    if (s.flagged) return
    await s.flag()
    toast('success', t('session.flagged'))
  }

  const finish = async (): Promise<void> => {
    setEnding(false)
    await s.end()
    await loadModules()
  }

  useEffect(() => {
    const picks = Object.fromEntries(
      (Object.entries(KEYS.pick) as [ChoiceKey, string][]).map(([k, code]) => [
        code,
        () => s.pick(k)
      ])
    )
    return tinykeys(window, {
      [KEYS.reveal]: (e) => {
        e.preventDefault()
        if (state.phase === 'stem') s.reveal()
        else if (state.phase === 'graded') s.next()
      },
      [KEYS.next]: () => {
        if (state.phase === 'graded') s.next()
      },
      [KEYS.known]: () => {
        if (state.phase === 'stem') s.known()
        else if (state.phase === 'choices') s.pick('B')
      },
      ...Object.fromEntries(
        Object.entries(picks)
          .filter(([code]) => code !== KEYS.known)
          .map(([code, run]) => [
            code,
            () => {
              if (state.phase === 'choices') run()
            }
          ])
      ),
      [KEYS.grade[1]]: () => {
        if (state.phase === 'solved') s.grade(1)
      },
      [KEYS.grade[2]]: () => {
        if (state.phase === 'solved') s.grade(2)
      },
      [KEYS.grade[3]]: () => {
        if (state.phase === 'solved') s.grade(3)
      },
      [KEYS.flag]: () => flag(),
      [KEYS.end]: () => {
        if (!ending) setEnding(true)
      }
    })
  }, [state, ending])

  if (state.phase === 'summary') {
    return (
      <Summary
        summary={state.summary}
        onBack={() => go({ name: 'chapters', moduleId })}
        onAgain={() => s.start(moduleId, chapter)}
      />
    )
  }

  if (state.phase === 'idle' || state.phase === 'loading') {
    return (
      <section className="ql-screen ql-session">
        <div className="tk-panel ql-question">
          <Skeleton lines={5} />
        </div>
      </section>
    )
  }

  if (state.phase === 'empty') {
    return (
      <section className="ql-screen ql-session">
        <div className="tk-panel ql-empty ql-transition-in">
          <h3 className="tk-h3">{t('session.empty.title')}</h3>
          <p className="tk-prose">{t('session.empty.body')}</p>
          <button type="button" className="tk-btn tk-btn-primary" onClick={finish}>
            {t('summary.back')}
          </button>
        </div>
      </section>
    )
  }

  const q = state.q
  const wrong = state.phase === 'choices' || state.phase === 'solved' ? state.wrong : {}
  const solved = state.phase === 'solved' ? state.result : null
  const graded = state.phase === 'graded' ? state.grade : null
  const showChoices = state.phase !== 'stem'
  const hints: [string, Key][] =
    state.phase === 'stem'
      ? [
          ['␣', 'session.hint.reveal'],
          ['B', 'session.hint.known'],
          ['F', 'session.hint.flag'],
          ['Esc', 'session.hint.end']
        ]
      : state.phase === 'choices'
        ? [
            ['A–E', 'session.hint.pick'],
            ['F', 'session.hint.flag'],
            ['Esc', 'session.hint.end']
          ]
        : state.phase === 'solved'
          ? [
              ['1 2 3', 'session.hint.grade'],
              ['F', 'session.hint.flag'],
              ['Esc', 'session.hint.end']
            ]
          : [
              ['↵', 'session.hint.next'],
              ['Ctrl + / −', 'session.hint.zoom'],
              ['Esc', 'session.hint.end']
            ]
  const known = 'known' in state && state.known

  return (
    <section className="ql-screen ql-session">
      <header className="ql-session-bar ql-transition-in">
        <div className="ql-session-meta">
          <span className="tk-mono">
            {t('session.progress', { index: q.index, total: s.total })}
          </span>
          <span className="tk-label">{t(`session.difficulty.${q.difficulty}` as Key)}</span>
          {q.relearn && (
            <span className="tk-label ql-badge-relearn">{t('session.relearnBadge')}</span>
          )}
          {known && <span className="tk-label ql-badge-known">{t('session.knownMarked')}</span>}
        </div>
        <div className="ql-session-meta">
          <span className="tk-label">{t('session.score')}</span>
          <span className="tk-mono ql-score">{s.score}</span>
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={flag}
            disabled={s.flagged}
            title={s.flagged ? t('session.flagged') : t('session.flag')}
          >
            {t('session.flag')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={() => setEnding(true)}
          >
            {t('session.end')}
          </button>
        </div>
      </header>

      <article className="tk-panel ql-question ql-transition-in" key={q.questionId}>
        <Stem key={q.questionId} q={q} speed={speed} />

        {!showChoices && (
          <div className="ql-actions">
            <button type="button" className="tk-btn tk-btn-ghost" onClick={s.known}>
              {t('session.known')}
              <kbd>B</kbd>
            </button>
            <button type="button" className="tk-btn tk-btn-primary" onClick={s.reveal}>
              {t('session.showChoices')}
              <kbd>␣</kbd>
            </button>
          </div>
        )}

        {showChoices && (
          <ol className="ql-choices">
            {q.choices.map((c, i) => {
              const isWrong = Boolean(wrong[c.key])
              const isCorrect = (solved?.correctKey ?? (graded ? undefined : undefined)) === c.key
              const disabled = Boolean(solved) || Boolean(graded) || isWrong
              return (
                <li
                  key={c.key}
                  className={`ql-choice ${isWrong ? 'ql-choice-wrong' : ''} ${isCorrect ? 'ql-choice-right' : ''}`}
                  style={{ '--ql-i': i } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => s.pick(c.key)}
                    disabled={disabled}
                    title={
                      isWrong ? t('session.wrong') : isCorrect ? t('session.correct') : undefined
                    }
                    aria-pressed={isCorrect || isWrong}
                  >
                    <span className="tk-mono ql-choice-key">{c.key}</span>
                    <Markdown md={c.md} assetBase={q.assetBase} className="ql-choice-text" />
                    {c.imageRef && (
                      <img src={q.assetBase + c.imageRef} alt="" className="ql-choice-img" />
                    )}
                  </button>
                  {isWrong && (
                    <p className="tk-error ql-distractor" role="status">
                      <span aria-hidden="true">✕</span>
                      <span>{wrong[c.key]}</span>
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        )}

        {solved && (
          <div className="ql-solved ql-transition-in">
            <hr className="tk-divider" />
            <h3 className="tk-h3">{t('session.solution')}</h3>
            {solved.solution && <Solution blocks={solved.solution} assetBase={q.assetBase} />}
            {solved.source && (
              <blockquote className="ql-source">
                <span className="tk-label">{t('session.source')}</span>
                <p className="tk-prose">“{solved.source.quote}”</p>
                <span className="tk-hint">
                  {t('session.sourceLine', {
                    file: solved.source.file,
                    from: solved.source.pages[0],
                    to: solved.source.pages[1]
                  })}
                </span>
              </blockquote>
            )}
            <div className="ql-grade">
              <span className="tk-label">{t('session.grade.title')}</span>
              <div className="ql-grade-row">
                {([1, 2, 3] as SelfAssess[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`tk-btn tk-btn-ghost ql-grade-btn ql-grade-${g}`}
                    onClick={() => s.grade(g)}
                  >
                    <span className="ql-grade-main">
                      {t(`session.grade.${g}` as Key)}
                      <kbd>{g}</kbd>
                    </span>
                    <span className="ql-grade-hint">{t(`session.grade.hint${g}` as Key)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {graded && (
          <div className="ql-graded ql-transition-in">
            <hr className="tk-divider" />
            <div className="ql-graded-row">
              <span className="tk-mono">
                {t('session.scoreDelta', { delta: graded.scoreDelta })}
              </span>
              <span className="tk-hint">
                {graded.retired
                  ? t('session.retired')
                  : t('session.dueIn', { when: whenLabel(graded.dueAt) })}
              </span>
              <button type="button" className="tk-btn tk-btn-primary" onClick={s.next} autoFocus>
                {graded.next ? t('session.next') : t('session.end')}
                <kbd>↵</kbd>
              </button>
            </div>
          </div>
        )}
      </article>

      <p className="tk-hint ql-keys">
        {hints.map(([k, key]) => (
          <span key={k} className="ql-key">
            <kbd>{k}</kbd>
            <span className="ql-key-label">{t(key)}</span>
          </span>
        ))}
      </p>

      {ending && (
        <Confirm text={t('session.endConfirm')} onNo={() => setEnding(false)} onYes={finish} />
      )}
    </section>
  )
}
