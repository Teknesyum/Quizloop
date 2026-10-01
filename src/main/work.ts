import { BrowserWindow } from 'electron'
import { CH, type WorkProgress, type WorkStep, type WorkTask } from '@shared/ipc'

export class Work {
  private last = -1
  private lastStep: WorkStep | null = null

  constructor(private readonly task: WorkTask) {}

  private send(p: WorkProgress): void {
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send(CH.workProgress, p)
  }

  at(step: WorkStep, from: number, to: number, done = 0, total = 0): void {
    const percent = total > 0 ? from + ((to - from) * done) / total : from
    const whole = Math.floor(percent)
    if (whole === this.last && step === this.lastStep && done !== total) return
    this.last = whole
    this.lastStep = step
    this.send({ task: this.task, step, done, total, percent, status: 'running' })
  }

  span(step: WorkStep, from: number, to: number): (done: number, total: number) => void {
    this.at(step, from, to)
    return (done, total) => this.at(step, from, to, done, total)
  }

  finish(ok: boolean): void {
    this.send({
      task: this.task,
      step: ok ? 'done' : 'failed',
      done: 0,
      total: 0,
      percent: 100,
      status: ok ? 'done' : 'error'
    })
  }
}
