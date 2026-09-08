import type { QuizloopApi } from '../shared/ipc'

declare global {
  interface Window {
    quizloop: QuizloopApi
  }
}

export {}
