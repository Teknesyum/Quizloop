import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { CorePorts } from '@core/ports'

export const nodePorts: CorePorts = {
  readText: (path) => readFile(path, 'utf8'),
  exists: async (path) => existsSync(path),
  sha256: async (text) => createHash('sha256').update(text, 'utf8').digest('hex'),
  now: () => new Date()
}
