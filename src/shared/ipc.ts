import type { Choice, ChoiceKey, SolutionBlock, Source } from './schema/question'

export type SelfAssess = 1 | 2 | 3
export type FsrsRating = 1 | 2 | 3 | 4

export interface ChapterSummary {
  chapter: string
  assetBase: string
  total: number
  dueToday: number
  unseen: number
  retired: number
  learning: number
}

export interface ModuleSummary {
  id: string
  name: string
  version: string
  path: string
  assetBase: string
  questionCount: number
  dueToday: number
  unseen: number
  retired: number
  learning: number
}

export interface QuestionView {
  questionId: string
  index: number
  total: number
  stem: { md: string; imageRef?: string }
  choices: Choice[]
  difficulty: string
  tags: string[]
  vurgu: string[]
  assetBase: string
  relearn: boolean
}

export interface AnswerResult {
  correct: boolean
  key: ChoiceKey
  explanation?: string
  correctKey?: ChoiceKey
  solution?: SolutionBlock[]
  source?: Source
  wrongPicks: number
}

export interface GradeResult {
  rating: FsrsRating
  dueAt: string
  retired: boolean
  scoreDelta: number
  next: QuestionView | null
}

export interface SessionSummary {
  sessionId: string
  moduleId: string
  seen: number
  correctFirstTry: number
  score: number
  retired: number
  relearned: number
  startedAt: string
  endedAt: string
}

export interface StatsOverview {
  modules: number
  cards: number
  dueToday: number
  reviewsTotal: number
  reviews7d: number
  retired: number
  streakDays: number
  perDay: { day: string; reviews: number; correct: number }[]
}

export interface Settings {
  dayStartHour: number
  modulesDir: string | null
  typerSpeed: 'slow' | 'normal' | 'fast' | 'off'
  sessionLimit: number
  soundOn: boolean
  fontScale: number
}

export const FONT_SCALES = [0.9, 1, 1.1, 1.25, 1.4, 1.6] as const

export interface InstallResult {
  ok: boolean
  moduleId?: string
  updated?: number
  reset?: number
  orphaned?: number
  error?: string
}

export interface IntegrityReport {
  ok: boolean
  detail: string
}

export interface QuizloopApi {
  pathOf(file: File): string | null
  app: {
    info(): Promise<{ version: string; platform: NodeJS.Platform; integrity: IntegrityReport }>
  }
  window: {
    minimize(): void
    toggleMaximize(): void
    close(): void
    isMaximized(): Promise<boolean>
    onMaximized(cb: (max: boolean) => void): () => void
  }
  settings: {
    get(): Promise<Settings>
    set(patch: Partial<Settings>): Promise<Settings>
    zoom(factor: number): void
    pickModulesDir(): Promise<string | null>
  }
  module: {
    list(): Promise<ModuleSummary[]>
    install(path: string): Promise<InstallResult>
    installSample(): Promise<InstallResult>
    pick(): Promise<InstallResult | null>
    remove(moduleId: string): Promise<void>
    reset(moduleId: string): Promise<void>
    chapters(moduleId: string): Promise<ChapterSummary[]>
  }
  session: {
    start(
      moduleId: string,
      chapter?: string | null
    ): Promise<{ sessionId: string; first: QuestionView | null; total: number }>
    known(sessionId: string): Promise<void>
    reveal(sessionId: string): Promise<void>
    answer(sessionId: string, key: ChoiceKey): Promise<AnswerResult>
    grade(sessionId: string, selfAssess: SelfAssess, durationMs: number): Promise<GradeResult>
    flag(sessionId: string, note?: string): Promise<void>
    end(sessionId: string): Promise<SessionSummary>
  }
  stats: {
    overview(): Promise<StatsOverview>
  }
}

export const CH = {
  appInfo: 'app:info',
  winMin: 'window:minimize',
  winMax: 'window:toggleMaximize',
  winClose: 'window:close',
  winIsMax: 'window:isMaximized',
  winMaxChanged: 'window:maximizedChanged',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  settingsPickDir: 'settings:pickModulesDir',
  moduleList: 'module:list',
  moduleInstall: 'module:install',
  moduleInstallSample: 'module:installSample',
  modulePick: 'module:pick',
  moduleRemove: 'module:remove',
  moduleReset: 'module:reset',
  moduleChapters: 'module:chapters',
  sessionStart: 'session:start',
  sessionKnown: 'session:known',
  sessionReveal: 'session:reveal',
  sessionAnswer: 'session:answer',
  sessionGrade: 'session:grade',
  sessionFlag: 'session:flag',
  sessionEnd: 'session:end',
  statsOverview: 'stats:overview'
} as const
