import { describe, expect, it } from 'vitest'
import { Rating, State } from 'ts-fsrs'
import type { Card } from '@main/db/types'
import { emptyCardFields, mapRating, schedule, softReset } from './fsrs'

const NOW = new Date('2026-09-08T09:00:00.000Z')

function card(over: Partial<Card> = {}): Card {
  return {
    module_id: 'ornek',
    question_id: 'ornek-0001',
    concept_id: 'c1',
    content_hash: 'a'.repeat(64),
    core_hash: 'b'.repeat(64),
    orphaned: 0,
    retired_at: null,
    flagged: 0,
    ...emptyCardFields(NOW),
    ...over
  } as Card
}

describe('mapRating', () => {
  const table: [number, boolean, number, number][] = [
    [1, false, 0, Rating.Again],
    [1, true, 0, Rating.Again],
    [2, false, 0, Rating.Hard],
    [2, false, 1, Rating.Again],
    [3, false, 0, Rating.Good],
    [3, true, 0, Rating.Easy],
    [3, false, 2, Rating.Hard],
    [3, true, 1, Rating.Hard]
  ]

  it.each(table)('self %i known=%s wrong=%i maps to %i', (self, known, wrong, expected) => {
    expect(mapRating(self as 1 | 2 | 3, { knownWithoutChoices: known, wrongPicks: wrong })).toBe(
      expected
    )
  })
})

describe('schedule', () => {
  it('pushes the due date forward on a good answer', () => {
    const { patch } = schedule(card(), Rating.Good, NOW)
    expect(new Date(String(patch.due)).getTime()).toBeGreaterThan(NOW.getTime())
    expect(patch.reps).toBe(1)
  })

  it('counts a lapse when a review card is failed', () => {
    const row = card({
      state: State.Review,
      stability: 12,
      difficulty: 5,
      reps: 4,
      last_review: NOW.toISOString()
    })
    const { patch } = schedule(row, Rating.Again, NOW)
    expect(patch.lapses).toBe(1)
  })

  it('is deterministic for the same clock', () => {
    const a = schedule(card(), Rating.Good, NOW).patch
    const b = schedule(card(), Rating.Good, NOW).patch
    expect(a.due).toBe(b.due)
  })
})

describe('softReset', () => {
  it('halves stability and makes the card due now', () => {
    const row = card({ state: State.Review, stability: 20 })
    const patch = softReset(row, NOW)
    expect(patch.stability).toBe(10)
    expect(patch.due).toBe(NOW.toISOString())
    expect(patch.state).toBe(State.Review)
  })

  it('leaves a new card new', () => {
    expect(softReset(card({ state: State.New }), NOW).state).toBe(State.New)
  })
})
