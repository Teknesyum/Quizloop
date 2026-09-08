import { z } from 'zod'

export const ModuleBlockRef = z.object({
  file: z.string().regex(/^blocks\/\d{4}\.json$/),
  count: z.number().int().nonnegative(),
  sha256: z.string().length(64)
})

export const ModuleMeta = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  language: z.string().default('tr'),
  description: z.string().optional(),
  source: z
    .object({
      title: z.string(),
      file: z.string().optional(),
      pages: z.number().int().positive().optional()
    })
    .optional(),
  blocks: z.array(ModuleBlockRef).min(1),
  questionCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime()
})

export type ModuleMeta = z.infer<typeof ModuleMeta>
export type ModuleBlockRef = z.infer<typeof ModuleBlockRef>
