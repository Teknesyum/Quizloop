import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Lock {
  packages: Record<string, { version?: string; dev?: boolean }>
}

export function kabuk(root: string = process.cwd()): string {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as Lock
  const rows = Object.entries(lock.packages)
    .filter(([path, p]) => path !== '' && !p.dev)
    .map(([path, p]) => `${path}@${p.version ?? ''}`)
    .sort()
  const electron = lock.packages['node_modules/electron']?.version ?? ''
  const builder = readFileSync(join(root, 'electron-builder.yml'), 'utf8').replace(/\r\n/g, '\n')
  return createHash('sha256')
    .update([`electron@${electron}`, ...rows, builder].join('\n'))
    .digest('hex')
    .slice(0, 16)
}
