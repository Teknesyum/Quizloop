import type { WorkProgress, WorkStep, WorkTask } from '@shared/ipc'

export type ProgressSink = (p: WorkProgress) => void

const TICK_MS = 200

export class Work {
  private last = -1
  private lastStep: WorkStep | null = null
  private lastAt = 0

  constructor(
    private readonly task: WorkTask,
    private readonly sink: ProgressSink
  ) {}

  at(step: WorkStep, from: number, to: number, done = 0, total = 0): void {
    const percent = total > 0 ? from + ((to - from) * Math.min(done, total)) / total : from
    const whole = Math.floor(percent)
    const at = Date.now()
    const same = whole === this.last && step === this.lastStep && done !== total
    if (same && at - this.lastAt < TICK_MS) return
    this.last = whole
    this.lastStep = step
    this.lastAt = at
    this.sink({ task: this.task, step, done, total, percent, status: 'running' })
  }

  span(step: WorkStep, from: number, to: number): (done: number, total: number) => void {
    return (done, total) => this.at(step, from, to, done, total)
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
