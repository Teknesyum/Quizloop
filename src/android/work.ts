import type { WorkProgress, WorkStep, WorkTask } from '@shared/ipc'

export type ProgressSink = (p: WorkProgress) => void

export class Work {
  private last = -1
  private lastStep: WorkStep | null = null

  constructor(
    private readonly task: WorkTask,
    private readonly sink: ProgressSink
  ) {}

  at(step: WorkStep, from: number, to: number, done = 0, total = 0): void {
    const percent = total > 0 ? from + ((to - from) * Math.min(done, total)) / total : from
    const whole = Math.floor(percent)
    if (whole === this.last && step === this.lastStep && done !== total) return
    this.last = whole
    this.lastStep = step
    this.sink({ task: this.task, step, done, total, percent, status: 'running' })
  }

  finish(ok: boolean): void {
    this.sink({
      task: this.task,
      step: ok ? 'done' : 'failed',
      done: 0,
      total: 0,
      percent: 100,
      status: ok ? 'done' : 'error'
    })
  }
}
