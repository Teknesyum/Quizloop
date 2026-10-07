import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SAMPLE_IDS } from '@shared/ipc'
import { dailyGoal, SettingsPatch } from './settings'

const start = new Date('2026-10-07T04:00:00.000Z')
const inDays = (n: number): string => new Date(start.getTime() + n * 86_400_000).toISOString()

describe('dailyGoal', () => {
  it('spreads the open questions over the days left of a span goal', () => {
    const g = dailyGoal({ days: 21, until: inDays(21) }, 200, 10, start)
    expect(g).toMatchObject({ days: 21, daysLeft: 21, daily: 10, perDay: false })
  })

  it('keeps a per-day goal fixed and derives the days from it', () => {
    const g = dailyGoal({ days: 1, until: inDays(1), perDay: 25 }, 200, 5, start)
    expect(g).toMatchObject({ daily: 25, daysLeft: 8, days: 8, perDay: true })
    expect(g.until).toBe(inDays(8))
  })

  it('never asks for more than what is left on a per-day goal', () => {
    const g = dailyGoal({ days: 1, until: inDays(1), perDay: 40 }, 3, 2, start)
    expect(g).toMatchObject({ daily: 5, daysLeft: 1 })
  })
})

describe('SettingsPatch goals', () => {
  it('accepts a custom span and a per-day count', () => {
    const goals = {
      a: { days: 17, until: inDays(17) },
      b: { days: 1, until: inDays(1), perDay: 30 }
    }
    expect(SettingsPatch.parse({ goals }).goals).toEqual(goals)
  })

  it('rejects a zero per-day count', () => {
    const goals = { a: { days: 1, until: inDays(1), perDay: 0 } }
    expect(SettingsPatch.safeParse({ goals }).success).toBe(false)
  })
})

describe('SAMPLE_IDS', () => {
  it('names every module under resources/ornek', () => {
    const root = join(__dirname, '../../resources/ornek')
    const ids = readdirSync(root).filter((id) => existsSync(join(root, id, 'module.json')))
    expect([...SAMPLE_IDS].sort()).toEqual(ids.sort())
  })
})
