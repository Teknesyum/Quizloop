import { z } from 'zod'

export const ImageRef = z.string().regex(/^assets\/(img|tbl|kaynak)\/[\w.-]+\.(webp|png|svg)$/)

export const Stem = z.object({
  md: z.string().min(1),
  imageRef: ImageRef.optional()
})

export const ChoiceKey = z.enum(['A', 'B', 'C', 'D', 'E'])

export const Choice = z.object({
  key: ChoiceKey,
  md: z.string().min(1),
  imageRef: ImageRef.optional()
})

export const SolutionBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), md: z.string().min(1) }),
  z.object({ type: z.literal('hint'), md: z.string().min(1) }),
  z.object({ type: z.literal('formula'), tex: z.string().min(1) }),
  z.object({ type: z.literal('image'), ref: ImageRef, caption: z.string().optional() }),
  z.object({
    type: z.literal('table'),
    header: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
    caption: z.string().optional()
  })
])

export const Kesit = z.object({
  pdfSayfa: z.number().int().positive(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  ref: ImageRef
})

export const Source = z.object({
  file: z.string().min(1),
  pages: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  quote: z.string().min(1),
  chapter: z.string().optional(),
  kesit: Kesit.optional()
})

export const QuestionKind = z.enum(['coktan-secmeli', 'acik-uclu'])

export const Difficulty = z.enum(['kolay', 'orta', 'zor'])

export const Question = z
  .object({
    id: z.string().min(1),
    conceptId: z.string().min(1),
    stem: Stem,
    kind: QuestionKind.default('coktan-secmeli'),
    choices: z.array(Choice).max(5).default([]),
    correct: ChoiceKey.optional(),
    beklenenCevap: z.string().min(1).optional(),
    distractors: z.partialRecord(ChoiceKey, z.string().min(1)).default({}),
    solution: z.array(SolutionBlock).min(1),
    source: Source,
    difficulty: Difficulty,
    tags: z.array(z.string()).default([]),
    vurgu: z.array(z.string()).default([]),
    contentHash: z.string().length(64),
    deleted: z.boolean().default(false)
  })
  .check((ctx) => {
    const q = ctx.value
    const keys = q.choices.map((c) => c.key)
    if (q.kind === 'acik-uclu') {
      if (keys.length) {
        ctx.issues.push({
          code: 'custom',
          message: 'open question carries choices',
          input: q,
          path: ['choices']
        })
      }
      if (!q.beklenenCevap) {
        ctx.issues.push({
          code: 'custom',
          message: 'open question needs beklenenCevap',
          input: q,
          path: ['beklenenCevap']
        })
      }
      return
    }
    if (keys.length < 2) {
      ctx.issues.push({
        code: 'custom',
        message: 'at least two choices',
        input: q,
        path: ['choices']
      })
      return
    }
    if (!q.correct) {
      ctx.issues.push({ code: 'custom', message: 'correct missing', input: q, path: ['correct'] })
      return
    }
    if (new Set(keys).size !== keys.length) {
      ctx.issues.push({
        code: 'custom',
        message: 'duplicate choice key',
        input: q,
        path: ['choices']
      })
    }
    if (!keys.includes(q.correct)) {
      ctx.issues.push({
        code: 'custom',
        message: 'correct not among choices',
        input: q,
        path: ['correct']
      })
    }
    for (const k of keys) {
      if (k !== q.correct && !q.distractors[k]) {
        ctx.issues.push({
          code: 'custom',
          message: `distractor explanation missing for ${k}`,
          input: q,
          path: ['distractors', k]
        })
      }
    }
  })

export const Block = z.object({
  blockId: z.string().regex(/^\d{4}$/),
  questions: z.array(Question).min(1)
})

export type Question = z.infer<typeof Question>
export type QuestionKind = z.infer<typeof QuestionKind>
export type Kesit = z.infer<typeof Kesit>
export type Choice = z.infer<typeof Choice>
export type ChoiceKey = z.infer<typeof ChoiceKey>
export type SolutionBlock = z.infer<typeof SolutionBlock>
export type Block = z.infer<typeof Block>
export type Source = z.infer<typeof Source>
