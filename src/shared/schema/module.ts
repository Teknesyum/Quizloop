import { z } from 'zod'

export const ModuleBlockRef = z.object({
  file: z.string().regex(/^blocks\/\d{4}\.json$/),
  count: z.number().int().nonnegative(),
  sha256: z.string().length(64)
})

export const BookPart = z.object({
  bolum: z.number().int().positive(),
  ilkSayfa: z.number().int().positive(),
  sonSayfa: z.number().int().positive(),
  dosya: z.string().regex(/^kaynak\/bolum\/[A-Za-z0-9._-]+\.pdf$/)
})

export const ModuleMeta = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  language: z.string().default('tr'),
  description: z.string().optional(),
  tags: z
    .array(z.string().regex(/^[\p{Ll}\p{N}][\p{Ll}\p{N}-]{0,31}$/u))
    .max(12)
    .default([]),
  source: z
    .object({
      title: z.string(),
      file: z.string().optional(),
      pages: z.number().int().positive().optional(),
      sayfaOfseti: z.number().int().default(0),
      bolumler: z.array(BookPart).optional()
    })
    .optional(),
  blocks: z.array(ModuleBlockRef).min(1),
  questionCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime()
})

export type ModuleMeta = z.infer<typeof ModuleMeta>
export type BookPart = z.infer<typeof BookPart>
export type ModuleBlockRef = z.infer<typeof ModuleBlockRef>
