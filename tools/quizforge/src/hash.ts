import { createHash } from 'node:crypto'

export function normalize(input: string | Buffer): string {
  const text = typeof input === 'string' ? input : input.toString('utf8')
  return text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n')
}

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(normalize(input), 'utf8').digest('hex')
}

export function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]])
        )
      : v
  )
}
