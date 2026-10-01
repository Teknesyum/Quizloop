import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

export type Tick = (done: number, total: number) => void

const WIDTH = 32

export async function pool<T>(
  items: T[],
  tick: Tick,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let next = 0
  let done = 0
  const lane = async (): Promise<void> => {
    while (next < items.length) {
      await fn(items[next++]!)
      tick(++done, items.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(WIDTH, items.length) }, lane))
  tick(items.length, items.length)
}

async function walk(dir: string, skip: (p: string) => boolean, out: string[]): Promise<void> {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name)
    if (skip(p)) continue
    if (d.isDirectory()) await walk(p, skip, out)
    else out.push(p)
  }
}

export async function listFiles(
  dir: string,
  skip: (p: string) => boolean = () => false
): Promise<string[]> {
  const out: string[] = []
  await walk(dir, skip, out)
  return out
}

export async function copyTree(
  src: string,
  dst: string,
  tick: Tick,
  skip: (p: string) => boolean = () => false
): Promise<void> {
  const files = await listFiles(src, skip)
  const dirs = [...new Set(files.map((f) => dirname(join(dst, relative(src, f)))))]
  await mkdir(dst, { recursive: true })
  for (const d of dirs) await mkdir(d, { recursive: true })
  await pool(files, tick, (f) => copyFile(f, join(dst, relative(src, f))))
}

export async function removeTree(dir: string, tick: Tick): Promise<void> {
  const files = await listFiles(dir).catch(() => [] as string[])
  await pool(files, tick, (f) => rm(f, { force: true }))
  await rm(dir, { recursive: true, force: true })
}

export const skipBuild = (p: string): boolean => /[\\/]build([\\/]|$)/.test(p)
