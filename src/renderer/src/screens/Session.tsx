import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tinykeys } from 'tinykeys'
import type { QuestionView, SelfAssess, SourceBook } from '@shared/ipc'
import type { ChoiceKey } from '@shared/schema/question'
import { BookButton } from '@renderer/components/BookButton'
import { BookViewer } from '@renderer/components/BookViewer'
import { useTargetWarmup, viewPdfPage } from '@renderer/components/bookdoc'
import { Solution } from '@renderer/components/Solution'
import { pushBack } from '@renderer/back'
import { Markdown } from '@renderer/components/Markdown'
import { Skeleton } from '@renderer/components/Skeleton'
import { StemMedia } from '@renderer/components/StemMedia'
import { altFor, markBoxes, plainText } from '@renderer/components/media'
import { useTyper } from '@renderer/hooks/useTyper'
import { lang, t, type Key } from '@renderer/i18n'
import { kaynakGoster } from '@renderer/kaynak'
import { KEYS } from '@renderer/keys'
import { useApp } from '@renderer/store/app'
import { useSession } from '@renderer/store/session'
import { Summary } from './Summary'

function mark(md: string, term: string, wrap: string): string {
  const at = md.indexOf(term)
  if (at === -1) return md
  if (md.slice(Math.max(0, at - 2), at).includes('*')) return md
  return md.slice(0, at) + wrap + term + wrap + md.slice(at + term.length)
}

function emphasize(md: string, vurgu: string[]): string {
  let out = md
  vurgu.forEach((term, i) => {
    out = mark(out, term, i % 2 === 0 ? '**' : '*')
  })
  return out
}

function splitAsk(md: string): { body: string; ask: string } {
  const m = md.match(/(?:^|(?<=[.!?]\s))([^.!?]*\?)\s*$/)
  const body = m && m.index !== undefined ? md.slice(0, m.index).trim() : ''
  if (body) return { body, ask: (m?.[1] ?? '').trim() }
  const cut = md.lastIndexOf('\n\n')
  if (cut > 0 && /\?\s*$/.test(md.slice(cut)))
    return { body: md.slice(0, cut).trim(), ask: md.slice(cut).trim() }
  return { body: md, ask: '' }
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
    return { body: emphasize(body, q.vurgu), ask: emphasize(ask, q.vurgu) }
  }, [q.questionId])
  const box = useRef<HTMLDivElement | null>(null)
  const { done, skip } = useTyper(box, speed)
  return (
    <div ref={box} className={`ql-stem ${done ? '' : 'ql-typing'}`} onClick={skip}>
      <Markdown md={full.body} assetBase={q.assetBase} className="tk-prose ql-stem-text" />
      {full.ask && (
        <Markdown md={full.ask} assetBase={q.assetBase} className="tk-prose ql-stem-ask" />
      )}
    </div>
  )
}

function whenLabel(iso: string): string {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  if (diff < 3600000) return d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(lang, { day: '2-digit', month: 'short' })
}

export function Session({
  moduleId,
  chapter,
  partial
}: {
  moduleId: string
  chapter: string | null
  partial: boolean
}): React.JSX.Element {
  const s = useSession()
  const settings = useApp((x) => x.settings)
  const go = useApp((x) => x.go)
  const toast = useApp((x) => x.toast)
  const loadModules = useApp((x) => x.loadModules)
  const [book, setBook] = useState<SourceBook | null>(null)
  const [reading, setReading] = useState<string | null>(null)
  const [whyAll, setWhyAll] = useState<string | null>(null)
  const [telling, setTelling] = useState<string | null>(null)
  const solvedRef = useRef<HTMLDivElement | null>(null)
  const speed = settings?.typerSpeed ?? 'normal'
  const state = s.state

  useEffect(() => {
    s.start(moduleId, chapter, partial)
    return () => s.reset()
  }, [moduleId, chapter, partial])

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

  const flag = async (): Promise<void> => {
    const now = useSession.getState()
    if (now.flagged || !('q' in now.state)) return
    try {
      await now.flag()
    } catch (e) {
      toast('danger', `${t('common.error')}: ${e instanceof Error ? e.message : String(e)}`)
      return
    }
    toast('success', t('session.flagged'))
  }

  const finish = useCallback(async (): Promise<void> => {
    await useSession.getState().end()
    await loadModules()
    const after = useSession.getState().state
    if (after.phase === 'summary' && after.summary.seen === 0) go({ name: 'library' })
  }, [loadModules, go])

  useEffect(
    () =>
      pushBack(() => {
        if (reading !== null) setReading(null)
        else if (['summary', 'idle', 'loading', 'empty', 'failed'].includes(state.phase))
          go({ name: 'chapters', moduleId })
        else void finish()
        return true
      }),
    [reading, state.phase, go, moduleId, finish]
  )

  useEffect(() => {
    if (state.phase !== 'solved') return
    solvedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [state.phase])

  const liveQ = 'q' in state ? state.q : null
  useTargetWarmup(book, liveQ ? viewPdfPage(liveQ, book?.sayfaOfseti ?? 0) : null)

  const autoNext =
    state.phase === 'graded' && state.grade.retired && state.grade.next ? state.q.questionId : null

  useEffect(() => {
    if (autoNext === null) return
    const id = window.setTimeout(() => s.next(), 1600)
    return () => window.clearTimeout(id)
  }, [autoNext])

  useEffect(() => {
    if (reading !== null || state.phase === 'summary') return
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
      [KEYS.next]: (e) => {
        if (e.target instanceof Element && e.target.closest('button')) return
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
      [KEYS.end]: () => void finish()
    })
  }, [state, reading])

  if (state.phase === 'summary') {
    return (
      <Summary
        summary={state.summary}
        onBack={() => go({ name: 'chapters', moduleId })}
        onAgain={() => s.start(moduleId, chapter, partial)}
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

  if (state.phase === 'failed') {
    return (
      <section className="ql-screen ql-session">
        <div className="tk-panel ql-empty ql-transition-in">
          <h3 className="tk-h3">{t('session.failed.title')}</h3>
          <p className="tk-prose">{t('session.failed.body')}</p>
          <p className="tk-prose ql-failed-detail">{state.message}</p>
          <div className="ql-failed-actions">
            <button
              type="button"
              className="tk-btn tk-btn-primary"
              onClick={() => s.start(moduleId, chapter, partial)}
            >
              {t('session.failed.retry')}
            </button>
            <button
              type="button"
              className="tk-btn"
              onClick={() => go({ name: 'chapters', moduleId })}
            >
              {t('summary.back')}
            </button>
          </div>
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
  const firstTry = Object.keys(wrong).length === 0
  const graded = state.phase === 'graded' ? state.grade : null
  const showChoices = state.phase !== 'stem'
  const open = q.kind === 'acik-uclu'
  const marking = q.kind === 'isaretleme'
  const marks = marking
    ? markBoxes(q.choices, {
        wrong,
        correct: solved?.correctKey,
        open: Boolean(solved) || Boolean(graded),
        live: state.phase === 'choices'
      })
    : undefined
  const hints: [string, Key][] =
    state.phase === 'stem'
      ? [
          [t('session.key.space'), open ? 'session.hint.answer' : 'session.hint.reveal'],
          ['B', open ? 'session.hint.knownOpen' : 'session.hint.known'],
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
  const here = `${q.questionId}:${q.index}`
  const others = Object.fromEntries(
    Object.entries(solved?.distractors ?? {}).filter(([k]) => !wrong[k as ChoiceKey])
  ) as Partial<Record<ChoiceKey, string>>
  const hasOthers = Object.keys(others).length > 0
  const why = whyAll === here ? others : {}
  const whyButton = hasOthers && (
    <button
      type="button"
      className="tk-btn tk-btn-ghost ql-btn-sm ql-why-all"
      aria-expanded={whyAll === here}
      onClick={() => setWhyAll(whyAll === here ? null : here)}
    >
      {t(whyAll === here ? 'session.whyOthersHide' : 'session.whyOthers')}
    </button>
  )

  return (
    <section className="ql-screen ql-session">
      <header className="ql-session-bar ql-transition-in">
        <div className="ql-session-meta">
          <span className="tk-mono">{t('session.left', { left: q.left })}</span>
          <span className={`tk-label ${open ? 'ql-badge-open' : 'ql-badge-choices'}`}>
            {open
              ? t('session.kindOpen')
              : marking
                ? t('session.kindMark')
                : t('session.kindChoices')}
          </span>
          {q.relearn && (
            <span className="tk-label ql-badge-relearn">{t('session.relearnBadge')}</span>
          )}
          {known && (
            <span className="tk-label ql-badge-known">
              {t(open ? 'session.knownMarkedOpen' : 'session.knownMarked')}
            </span>
          )}
        </div>
        <div className="ql-session-meta">
          <span className="tk-label">{t('session.score')}</span>
          <span key={s.score} className="tk-mono ql-score ql-score-bump">
            {s.score}
          </span>
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={() => go({ name: 'chapters', moduleId })}
          >
            {t('session.back')}
          </button>
          <button
            type="button"
            className="tk-btn tk-btn-ghost ql-btn-sm"
            onClick={flag}
            disabled={s.flagged}
            title={s.flagged ? t('session.flagged') : t('session.flag')}
          >
            {t('session.flag')}
          </button>
          <button type="button" className="tk-btn tk-btn-ghost ql-btn-sm" onClick={finish}>
            {t('session.end')}
          </button>
        </div>
      </header>

      <article className="tk-panel ql-question" key={`${q.questionId}:${q.index}`}>
        <StemMedia
          stem={q.stem}
          assetBase={q.assetBase}
          marks={marks}
          onMark={state.phase === 'choices' ? (k) => void s.pick(k) : undefined}
        />
        <Stem key={here} q={q} speed={speed} />

        {q.anlatim && (
          <div className="ql-tell">
            <button
              type="button"
              className="tk-btn tk-btn-ghost ql-btn-sm"
              aria-expanded={telling === here}
              onClick={() => setTelling(telling === here ? null : here)}
            >
              {t('session.explain')}
            </button>
            {telling === here && (
              <div className="ql-tell-body ql-transition-in">
                <span className="tk-label">{t('session.explainTitle')}</span>
                <Solution blocks={q.anlatim} assetBase={q.assetBase} />
              </div>
            )}
          </div>
        )}

        {!showChoices && (
          <div className="ql-actions">
            <button type="button" className="tk-btn tk-btn-ghost" onClick={s.known}>
              {t('session.known')}
              <kbd>B</kbd>
            </button>
            <button type="button" className="tk-btn tk-btn-primary" onClick={s.reveal}>
              {open
                ? t('session.showAnswer')
                : marking
                  ? t('session.showMarks')
                  : t('session.showChoices')}
              <kbd>{t('session.key.space')}</kbd>
            </button>
          </div>
        )}

        {marking && showChoices && (
          <div className="ql-mark-notes">
            {state.phase === 'choices' && <p className="tk-hint">{t('session.markPrompt')}</p>}
            {q.choices
              .filter((c) => wrong[c.key])
              .map((c) => (
                <p key={c.key} className="tk-error ql-distractor ql-mark-note" role="status">
                  <span aria-hidden="true">✕</span>
                  <span className="tk-mono">{c.key}</span>
                  <span>{wrong[c.key]}</span>
                </p>
              ))}
            {q.choices
              .filter((c) => why[c.key])
              .map((c) => (
                <div key={c.key} className="tk-hint ql-distractor ql-mark-note">
                  <span className="tk-mono">{c.key}</span>
                  <Markdown md={why[c.key] ?? ''} assetBase={q.assetBase} className="ql-note-md" />
                </div>
              ))}
            {whyButton}
            {marks?.some((m) => m.open) && (
              <ul className="ql-mark-legend">
                {marks.map((m) => (
                  <li key={m.key} className={`ql-mark-legend-row ql-mark-legend-${m.state}`}>
                    <span className="tk-mono ql-mark-legend-key">{m.key}</span>
                    <span>{plainText(m.md)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!marking && showChoices && q.choices.length > 0 && (
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
                    <span className="tk-mono ql-choice-key">{c.key})</span>
                    <Markdown md={c.md} assetBase={q.assetBase} className="ql-choice-text" />
                    {c.imageRef && (
                      <img
                        src={q.assetBase + c.imageRef}
                        alt={altFor(c.alt, c.md, t('media.choiceAlt', { key: c.key }))}
                        className="ql-choice-img"
                      />
                    )}
                  </button>
                  {isWrong && (
                    <p className="tk-error ql-distractor" role="status">
                      <span aria-hidden="true">✕</span>
                      <span>{wrong[c.key]}</span>
                    </p>
                  )}
                  {why[c.key] && (
                    <Markdown
                      md={why[c.key] ?? ''}
                      assetBase={q.assetBase}
                      className="tk-hint ql-why ql-note-md"
                    />
                  )}
                </li>
              )
            })}
          </ol>
        )}

        {!marking && whyButton}

        {solved && (
          <div className="ql-solved ql-transition-in" ref={solvedRef}>
            {!open && (
              <p
                className={`ql-verdict ${firstTry ? 'ql-verdict-right' : 'ql-verdict-wrong'}`}
                role="status"
              >
                <span aria-hidden="true">{firstTry ? '✔' : '✕'}</span>
                <span>{firstTry ? t('session.verdictRight') : t('session.verdictWrong')}</span>
              </p>
            )}
            {solved.beklenenCevap && (
              <div className="ql-expected">
                <span className="tk-label ql-expected-label">{t('session.expected')}</span>
                <Markdown
                  md={solved.beklenenCevap}
                  assetBase={q.assetBase}
                  className="tk-prose ql-expected-body"
                />
              </div>
            )}
            <h3 className="tk-h3">{t('session.solution')}</h3>
            {solved.solution && <Solution blocks={solved.solution} assetBase={q.assetBase} />}
            {solved.source && kaynakGoster(q.tags) && (
              <blockquote className="ql-source">
                <span className="tk-label ql-source-label">{t('session.source')}</span>
                <p className="ql-source-quote">{solved.source.quote}</p>
                <span className="tk-hint ql-source-line">
                  {book?.available ? (
                    <>
                      {t('session.sourceFile', { file: solved.source.file })}
                      <span>
                        {t('session.sourcePages', {
                          from: solved.source.pages[0],
                          to: solved.source.pages[1]
                        })}
                      </span>
                    </>
                  ) : (
                    solved.source.file
                  )}
                </span>
                {book?.available && (
                  <BookButton file={solved.source.file} onOpen={() => setReading(q.questionId)} />
                )}
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
                {autoNext === null
                  ? graded.next
                    ? t('session.next')
                    : t('session.end')
                  : t('session.autoNext')}
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

      {reading === q.questionId && solved?.source && (
        <BookViewer
          key={book?.path ?? 'kesit'}
          book={book}
          moduleId={moduleId}
          source={solved.source}
          assetBase={q.assetBase}
          onBook={setBook}
          onClose={() => setReading(null)}
        />
      )}
    </section>
  )
}
