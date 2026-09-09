import { create } from 'zustand'
import type {
  AnswerResult,
  GradeResult,
  QuestionView,
  SelfAssess,
  SessionSummary
} from '@shared/ipc'
import type { ChoiceKey } from '@shared/schema/question'

export type Phase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'stem'; q: QuestionView; known: boolean }
  | {
      phase: 'choices'
      q: QuestionView
      known: boolean
      wrong: Partial<Record<ChoiceKey, string>>
      last?: ChoiceKey
    }
  | {
      phase: 'solved'
      q: QuestionView
      known: boolean
      wrong: Partial<Record<ChoiceKey, string>>
      result: AnswerResult
    }
  | { phase: 'graded'; q: QuestionView; grade: GradeResult }
  | { phase: 'summary'; summary: SessionSummary }

interface SessionState extends Record<string, unknown> {
  sessionId: string | null
  moduleId: string | null
  total: number
  score: number
  state: Phase
  shownAt: number
  flagged: boolean
  start(moduleId: string, chapter?: string | null): Promise<void>
  known(): Promise<void>
  reveal(): Promise<void>
  pick(key: ChoiceKey): Promise<void>
  grade(self: SelfAssess): Promise<void>
  next(): void
  flag(): Promise<void>
  end(): Promise<void>
  reset(): void
}

function show(q: QuestionView | null): Phase {
  return q ? { phase: 'stem', q, known: false } : { phase: 'empty' }
}

export const useSession = create<SessionState>((set, get) => ({
  sessionId: null,
  moduleId: null,
  total: 0,
  score: 0,
  state: { phase: 'idle' },
  shownAt: 0,
  flagged: false,
  start: async (moduleId, chapter) => {
    set({ state: { phase: 'loading' }, moduleId, score: 0, flagged: false })
    const r = await window.quizloop.session.start(moduleId, chapter ?? null)
    set({
      sessionId: r.sessionId,
      total: r.total,
      state: show(r.first),
      shownAt: performance.now()
    })
  },
  known: async () => {
    const { state, sessionId } = get()
    if (state.phase !== 'stem' || !sessionId) return
    await window.quizloop.session.known(sessionId)
    await window.quizloop.session.reveal(sessionId)
    set({ state: { phase: 'choices', q: state.q, known: true, wrong: {} } })
  },
  reveal: async () => {
    const { state, sessionId } = get()
    if (state.phase !== 'stem' || !sessionId) return
    await window.quizloop.session.reveal(sessionId)
    set({ state: { phase: 'choices', q: state.q, known: state.known, wrong: {} } })
  },
  pick: async (key) => {
    const { state, sessionId } = get()
    if (!sessionId) return
    if (state.phase !== 'choices') return
    if (state.phase === 'choices' && state.wrong[key]) return
    const wrong = state.phase === 'choices' ? state.wrong : {}
    const r = await window.quizloop.session.answer(sessionId, key)
    if (r.correct) {
      set({
        state: {
          phase: 'solved',
          q: state.q,
          known: state.known && r.wrongPicks === 0,
          wrong,
          result: r
        }
      })
    } else {
      set({
        state: {
          phase: 'choices',
          q: state.q,
          known: false,
          wrong: { ...wrong, [key]: r.explanation ?? '' },
          last: key
        }
      })
    }
  },
  grade: async (self) => {
    const { state, sessionId, shownAt } = get()
    if (state.phase !== 'solved' || !sessionId) return
    const g = await window.quizloop.session.grade(sessionId, self, performance.now() - shownAt)
    set((s) => ({
      score: s.score + g.scoreDelta,
      state: { phase: 'graded', q: state.q, grade: g },
      flagged: false
    }))
  },
  next: () => {
    const { state } = get()
    if (state.phase !== 'graded') return
    set({ state: show(state.grade.next), shownAt: performance.now() })
  },
  flag: async () => {
    const { sessionId, state } = get()
    if (!sessionId || !('q' in state)) return
    await window.quizloop.session.flag(sessionId)
    set({ flagged: true })
  },
  end: async () => {
    const { sessionId } = get()
    if (!sessionId) return
    const summary = await window.quizloop.session.end(sessionId)
    set({ sessionId: null, state: { phase: 'summary', summary } })
  },
  reset: () =>
    set({
      sessionId: null,
      moduleId: null,
      total: 0,
      score: 0,
      state: { phase: 'idle' },
      flagged: false
    })
}))
