// @vitest-environment node
import { beforeEach, expect, it } from 'vitest'
import { useSession } from '@renderer/store/session'

function stubStart(impl: () => Promise<unknown>): void {
  ;(globalThis as unknown as { window: Record<string, unknown> }).window = {
    quizloop: { session: { start: impl } }
  }
}

beforeEach(() => {
  useSession.getState().reset()
})

it('yukleme patlarsa faz failed olur, iskelette kalmaz', async () => {
  stubStart(() =>
    Promise.reject(new Error("Error invoking remote method 'session:start': block hash mismatch"))
  )
  await useSession.getState().start('m1', null)
  const s = useSession.getState().state
  expect(s.phase).toBe('failed')
  if (s.phase === 'failed') expect(s.message).toBe('block hash mismatch')
})

it('yukleme basarili olursa soru gosterilir', async () => {
  const q = { id: 'q1', stem: { md: 'soru' }, kind: 'acik-uclu', choices: [] }
  stubStart(() => Promise.resolve({ sessionId: 's1', total: 1, first: q }))
  await useSession.getState().start('m1', null)
  expect(useSession.getState().state.phase).toBe('stem')
})

it('acik uclu soruda biliyorum cozumu acar', async () => {
  const q = { id: 'q1', stem: { md: 'soru' }, kind: 'acik-uclu', choices: [] }
  const sonuc = { correct: true, beklenenCevap: 'cevap', wrongPicks: 0 }
  ;(globalThis as unknown as { window: Record<string, unknown> }).window = {
    quizloop: {
      session: {
        start: () => Promise.resolve({ sessionId: 's1', total: 1, first: q }),
        known: () => Promise.resolve(),
        reveal: () => Promise.resolve(sonuc)
      }
    }
  }
  await useSession.getState().start('m1', null)
  await useSession.getState().known()
  const s = useSession.getState().state
  expect(s.phase).toBe('solved')
  if (s.phase === 'solved') expect(s.known).toBe(true)
})

it('soru yoksa faz empty olur', async () => {
  stubStart(() => Promise.resolve({ sessionId: 's1', total: 0, first: null }))
  await useSession.getState().start('m1', null)
  expect(useSession.getState().state.phase).toBe('empty')
})

it('start once loading fazina gecer', () => {
  let resolve: (v: unknown) => void = () => {}
  stubStart(() => new Promise((r) => (resolve = r)))
  const p = useSession.getState().start('m1', null)
  expect(useSession.getState().state.phase).toBe('loading')
  resolve({ sessionId: 's1', total: 0, first: null })
  return p
})
