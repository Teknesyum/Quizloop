import type { Kysely } from 'kysely'
import type { Database } from '@core/db/types'
import type { CorePorts, SettingsStore } from '@core/ports'
import { SessionMachine } from '@core/session/machine'
import { dayStart } from '@core/settings'
import type {
  BankQuestion,
  BankRow,
  ChapterSummary,
  ModuleSummary,
  QuizloopApi,
  Settings,
  SourceBook,
  StatsOverview
} from '@shared/ipc'
import { flagFile, type FlagFile, moduleQuestion, moduleQuestions, setFlag } from './bank'
import { Library } from './library'
import { forgetModule, listModules, moduleChapters, resetModule } from './modules'
import { sourceBook, type BookResolver } from './source'
import { statsOverview } from './stats'

export interface CoreDeps {
  db: Kysely<Database>
  ports: CorePorts
  settings: SettingsStore
  books: BookResolver
  assetBase(moduleId: string): string
}

export interface Core {
  library: Library
  machine: SessionMachine
  dayStart(now: Date): Date
  settings: {
    get(): Settings
    set(patch: Partial<Settings>): Settings | Promise<Settings>
  }
  module: {
    list(): Promise<ModuleSummary[]>
    chapters(moduleId: string): Promise<ChapterSummary[]>
    questions(moduleId: string): Promise<BankRow[]>
    question(moduleId: string, questionId: string): Promise<BankQuestion | null>
    forget(moduleId: string): Promise<string | null>
    reset(moduleId: string, chapter?: string): Promise<void>
  }
  flags: {
    set(moduleId: string, questionId: string, flagged: boolean, note?: string): Promise<void>
    file(moduleId: string): Promise<FlagFile | null>
  }
  session: QuizloopApi['session']
  source: {
    book(moduleId: string): Promise<SourceBook>
    peek(moduleId: string): Promise<SourceBook>
  }
  stats: {
    overview(): Promise<StatsOverview>
  }
}

export function createCore(deps: CoreDeps): Core {
  const { db, ports, settings, books, assetBase } = deps
  const library = new Library(db, ports)
  const dayOf = (now: Date): Date => dayStart(now, settings.get().dayStartHour)
  const machine = new SessionMachine({
    db,
    indexFor: (id) => library.indexFor(id),
    assetBase,
    dayStart: dayOf,
    limit: () => settings.get().sessionLimit,
    now: () => ports.now()
  })
  const ctx = {
    db,
    ports,
    library,
    assetBase,
    books,
    dayStart: dayOf,
    goals: () => settings.get().goals ?? {}
  }

  return {
    library,
    machine,
    dayStart: dayOf,
    settings: {
      get: (): Settings => settings.get(),
      set: (patch: Partial<Settings>) => settings.set(patch)
    },
    module: {
      list: () => listModules(ctx),
      chapters: async (moduleId: string) => moduleChapters(ctx, moduleId),
      questions: (moduleId: string) => moduleQuestions(ctx, moduleId),
      question: (moduleId: string, questionId: string) => moduleQuestion(ctx, moduleId, questionId),
      forget: async (moduleId: string) => {
        const path = await forgetModule(db, moduleId)
        await library.reload()
        return path
      },
      reset: (moduleId: string, chapter?: string) => resetModule(db, moduleId, chapter)
    },
    flags: {
      set: (moduleId: string, questionId: string, flagged: boolean, note?: string) =>
        setFlag(ctx, moduleId, questionId, flagged, note),
      file: (moduleId: string) => flagFile(ctx, moduleId)
    },
    session: {
      start: async (moduleId: string, chapter?: string | null) => {
        await library.refresh()
        return machine.start(moduleId, chapter ?? null)
      },
      known: async (id: string) => machine.known(id),
      reveal: async (id: string) => machine.reveal(id),
      answer: async (id, key) => machine.answer(id, key),
      grade: (id: string, self: Parameters<SessionMachine['grade']>[1], ms: number) =>
        machine.grade(id, self, ms),
      flag: (id: string, note?: string) => machine.flag(id, note),
      end: (id: string) => machine.end(id)
    },
    source: {
      book: async (moduleId: string) => {
        await library.refresh()
        return sourceBook(ctx, moduleId)
      },
      peek: (moduleId: string) => sourceBook(ctx, moduleId)
    },
    stats: {
      overview: () => statsOverview(db, ports.now(), dayOf)
    }
  }
}
