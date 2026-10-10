import { z } from 'zod'
import { ModuleMeta } from './module'

export const CatalogChannel = z.object({
  id: ModuleMeta.shape.id,
  name: z.string().min(1).max(120),
  description: z.string().max(400).optional(),
  version: ModuleMeta.shape.version,
  package: z.string().min(1).max(2000),
  size: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  questionCount: z.number().int().nonnegative().optional()
})

export const CatalogFile = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1).max(120),
  publisher: z.string().min(1).max(120),
  contact: z.string().max(200).optional(),
  channels: z.array(CatalogChannel).max(500)
})

export type CatalogChannel = z.infer<typeof CatalogChannel>
export type CatalogFile = z.infer<typeof CatalogFile>
