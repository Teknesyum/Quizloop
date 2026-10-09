import { z } from 'zod'

export const ImageRef = z.string().regex(/^assets\/(img|tbl|kaynak)\/[\w.-]+\.(webp|png|svg)$/)

export const Alt = z.string().min(1).max(400)

const Unit = z.number().min(0).max(1)

export const Box = z
  .tuple([Unit, Unit, Unit, Unit])
  .refine(
    ([x, y, w, h]) => w > 0 && h > 0 && x + w <= 1.0001 && y + h <= 1.0001,
    'box outside image'
  )

export const Table = z.object({
  header: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
  caption: z.string().optional(),
  rowHeader: z.boolean().optional()
})

export const Mask = z.object({
  box: Box,
  label: z.string().min(1).max(4).optional()
})

export const Stem = z.object({
  md: z.string().min(1),
  imageRef: ImageRef.optional(),
  alt: Alt.optional(),
  table: Table.optional(),
  masks: z.array(Mask).max(12).optional()
})

export const ChoiceKey = z.enum(['A', 'B', 'C', 'D', 'E'])

export const Choice = z.object({
  key: ChoiceKey,
  md: z.string().min(1),
  imageRef: ImageRef.optional(),
  alt: Alt.optional(),
  box: Box.optional()
})

export const SolutionBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), md: z.string().min(1) }),
  z.object({ type: z.literal('hint'), md: z.string().min(1) }),
  z.object({ type: z.literal('formula'), tex: z.string().min(1) }),
  z.object({
    type: z.literal('image'),
    ref: ImageRef,
    caption: z.string().optional(),
    alt: Alt.optional()
  }),
  Table.extend({ type: z.literal('table') }),
  z.object({
    type: z.literal('sayfa'),
    pdfSayfa: z.number().int().positive(),
    alinti: z.string().min(1).optional(),
    isaretler: z
      .array(z.object({ bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]) }))
      .optional(),
    ref: ImageRef.optional()
  })
])

export const Kesit = z.object({
  pdfSayfa: z.number().int().positive(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  ref: ImageRef
})

export const Isaret = z.object({
  pdfSayfa: z.number().int().positive(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()])
})

export const Source = z.object({
  file: z.string().min(1),
  pages: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  quote: z.string().min(1),
  chapter: z.string().optional(),
  kesit: Kesit.optional(),
  isaretler: z.array(Isaret).optional()
})

export const QuestionKind = z.enum(['coktan-secmeli', 'acik-uclu', 'isaretleme'])

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
    anlatim: z.array(SolutionBlock).min(1).optional(),
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
    if (q.kind === 'isaretleme') {
      if (!q.stem.imageRef) {
        ctx.issues.push({
          code: 'custom',
          message: 'marking question needs a stem image',
          input: q,
          path: ['stem', 'imageRef']
        })
      }
      q.choices.forEach((c, i) => {
        if (!c.box) {
          ctx.issues.push({
            code: 'custom',
            message: 'marking choice needs a box',
            input: q,
            path: ['choices', i, 'box']
          })
        }
      })
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
export type Table = z.infer<typeof Table>
export type Mask = z.infer<typeof Mask>
export type Box = z.infer<typeof Box>
export type Stem = z.infer<typeof Stem>
export type Kesit = z.infer<typeof Kesit>
export type Isaret = z.infer<typeof Isaret>
export type Choice = z.infer<typeof Choice>
export type ChoiceKey = z.infer<typeof ChoiceKey>
export type SolutionBlock = z.infer<typeof SolutionBlock>
export type Block = z.infer<typeof Block>
export type Source = z.infer<typeof Source>
