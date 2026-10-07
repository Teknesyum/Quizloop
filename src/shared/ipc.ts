import type {
  Choice,
  ChoiceKey,
  QuestionKind,
  SolutionBlock,
  Source,
  Stem
} from './schema/question'

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
  retiredToday: number
  goal: ModuleGoal | null
}

export interface ModuleGoal {
  days: number
  daily: number
  daysLeft: number
  until: string
}

export interface GoalSetting {
  days: number
  until: string
}

export const GOAL_DAYS = [7, 21, 30, 90, 365, 1095] as const

export function goalKey(moduleId: string, chapter: string | null): string {
  return chapter === null ? moduleId : `${moduleId}/${chapter}`
}

export interface ModuleSummary {
  id: string
  name: string
  version: string
  path: string
  assetBase: string
  tags: string[]
  questionCount: number
  dueToday: number
  unseen: number
  retired: number
  learning: number
  retiredToday: number
  goal: ModuleGoal | null
}

export interface QuestionView {
  questionId: string
  index: number
  total: number
  stem: Stem
  kind: QuestionKind
  choices: Choice[]
  difficulty: string
  tags: string[]
  vurgu: string[]
  assetBase: string
  relearn: boolean
  kaynak?: { sayfa: number; pdfSayfa?: number }
}

export interface AnswerResult {
  correct: boolean
  key?: ChoiceKey
  beklenenCevap?: string
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
  states: Record<CardStatus, number>
  progress: { id: string; name: string; total: number; seen: number; retired: number }[]
}

export type CardStatus = 'yeni' | 'ogreniyor' | 'tekrar' | 'emekli'

export interface BankRow {
  questionId: string
  chapter: string | null
  kind: QuestionKind
  difficulty: string
  stem: string
  status: CardStatus
  due: string | null
  flagged: boolean
  note: string | null
}

export interface BankQuestion {
  questionId: string
  stem: Stem
  kind: QuestionKind
  choices: Choice[]
  correct?: ChoiceKey
  beklenenCevap?: string
  solution: SolutionBlock[]
  source: Source
  tags: string[]
  assetBase: string
}

export interface FlagExport {
  ok: boolean
  path?: string
  count?: number
}

export interface UpdateStatus {
  state:
    | 'idle'
    | 'checking'
    | 'none'
    | 'available'
    | 'downloading'
    | 'ready'
    | 'notice'
    | 'updated'
    | 'error'
  version?: string
  percent?: number
  url?: string
  error?: string
}

export interface TransferResult {
  ok: boolean
  path?: string
  modules?: number
  error?: string
}

export interface Settings {
  dayStartHour: number
  modulesDir: string | null
  typerSpeed: 'slow' | 'normal' | 'fast' | 'off'
  sessionLimit: number
  soundOn: boolean
  fontScale: number
  blinkSeconds: number
  autoUpdate: boolean
  welcomeSeen: boolean
  samplesUsed: boolean
  goals: Record<string, GoalSetting>
  goalNotify: boolean
}

export const FONT_SCALES = [0.9, 1, 1.1, 1.25, 1.4, 1.6] as const

export type WorkTask = 'install' | 'remove' | 'export' | 'import'
export type WorkStep =
  | 'read'
  | 'unpack'
  | 'write'
  | 'extract'
  | 'verify'
  | 'copy'
  | 'sync'
  | 'remove'
  | 'database'
  | 'done'
  | 'failed'
export type WorkStatus = 'running' | 'done' | 'error'

export interface WorkProgress {
  task: WorkTask
  step: WorkStep
  done: number
  total: number
  percent: number
  status: WorkStatus
}

export interface VersionChange {
  moduleId: string
  name: string
  from: string
  to: string
  newer: boolean
}

export interface InstallConfirm extends VersionChange {
  ask: number
}

export interface InstallResult {
  ok: boolean
  cancelled?: boolean
  moduleId?: string
  name?: string
  questionCount?: number
  updated?: number
  reset?: number
  orphaned?: number
  error?: string
}

export interface BookPartLink {
  bolum: number
  ilkSayfa: number
  sonSayfa: number
  url: string
}

export interface SourceBook {
  available: boolean
  url: string | null
  path: string | null
  sayfaOfseti: number
  pages: number | null
  parts?: BookPartLink[] | null
  sagdanSola?: boolean
}

export interface IntegrityReport {
  ok: boolean
  detail: string
}

export const SOURCE_URL = 'https://github.com/Teknesyum/Quizloop'

export interface Capabilities {
  windowChrome: boolean
  shortcuts: boolean
  pinchZoom: boolean
  backButton: boolean
  updater: boolean
  folders: boolean
  settingsFile: boolean
  packageImport: boolean
}

export const DESKTOP_CAPABILITIES: Capabilities = {
  windowChrome: true,
  shortcuts: true,
  pinchZoom: false,
  backButton: false,
  updater: true,
  folders: true,
  settingsFile: true,
  packageImport: false
}

export interface Reminder {
  id: number
  at: number
  title: string
  body: string
}

export interface QuizloopApi {
  capabilities: Capabilities
  notify?: {
    ask(): Promise<boolean>
    plan(items: Reminder[]): Promise<void>
  }
  pathOf(file: File): string | null
  app: {
    info(): Promise<{
      version: string
      platform: NodeJS.Platform | 'web'
      integrity: IntegrityReport
    }>
    onBack(cb: () => void): () => void
    openSource(): void
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
    pick(kind: 'file' | 'folder'): Promise<InstallResult | null>
    onInstalled(cb: (r: InstallResult) => void): () => void
    drainOpened(): Promise<void>
    onConfirm(cb: (c: InstallConfirm) => void): () => void
    answer(ask: number, yes: boolean): void
    remove(moduleId: string): Promise<void>
    reset(moduleId: string, chapter?: string): Promise<void>
    chapters(moduleId: string): Promise<ChapterSummary[]>
    questions(moduleId: string): Promise<BankRow[]>
    question(moduleId: string, questionId: string): Promise<BankQuestion | null>
  }
  flags: {
    set(moduleId: string, questionId: string, flagged: boolean, note?: string): Promise<void>
    export(moduleId: string): Promise<FlagExport>
  }
  update: {
    status(): Promise<UpdateStatus>
    check(): Promise<UpdateStatus>
    download(install: boolean): void
    cancel(): void
    install(): void
    open(): void
    onStatus(cb: (s: UpdateStatus) => void): () => void
  }
  transfer: {
    exportTo(): Promise<TransferResult>
    importFrom(): Promise<TransferResult>
  }
  session: {
    start(
      moduleId: string,
      chapter?: string | null
    ): Promise<{ sessionId: string; first: QuestionView | null; total: number }>
    known(sessionId: string): Promise<void>
    reveal(sessionId: string): Promise<AnswerResult | null>
    answer(sessionId: string, key: ChoiceKey): Promise<AnswerResult>
    grade(sessionId: string, selfAssess: SelfAssess, durationMs: number): Promise<GradeResult>
    flag(sessionId: string, note?: string): Promise<void>
    end(sessionId: string): Promise<SessionSummary>
  }
  source: {
    book(moduleId: string): Promise<SourceBook>
    pickBook(moduleId: string): Promise<SourceBook>
    forgetBook(moduleId: string): Promise<SourceBook>
  }
  work: {
    onProgress(cb: (p: WorkProgress) => void): () => void
  }
  stats: {
    overview(): Promise<StatsOverview>
  }
}

export const CH = {
  appInfo: 'app:info',
  appOpenSource: 'app:openSource',
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
  moduleInstalled: 'module:installed',
  moduleConfirm: 'module:confirm',
  moduleAnswer: 'module:answer',
  workProgress: 'work:progress',
  moduleDrainOpened: 'module:drainOpened',
  moduleRemove: 'module:remove',
  moduleReset: 'module:reset',
  moduleChapters: 'module:chapters',
  moduleQuestions: 'module:questions',
  moduleQuestion: 'module:question',
  flagSet: 'flags:set',
  flagExport: 'flags:export',
  updateStatus: 'update:status',
  updateCheck: 'update:check',
  updateDownload: 'update:download',
  updateCancel: 'update:cancel',
  updateInstall: 'update:install',
  updateOpen: 'update:open',
  updateChanged: 'update:changed',
  transferExport: 'transfer:export',
  transferImport: 'transfer:import',
  sessionStart: 'session:start',
  sessionKnown: 'session:known',
  sessionReveal: 'session:reveal',
  sessionAnswer: 'session:answer',
  sessionGrade: 'session:grade',
  sessionFlag: 'session:flag',
  sessionEnd: 'session:end',
  sourceBook: 'source:book',
  sourcePickBook: 'source:pickBook',
  sourceForgetBook: 'source:forgetBook',
  statsOverview: 'stats:overview'
} as const
