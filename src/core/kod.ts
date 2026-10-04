import { z } from 'zod'
import { newer } from './version'

export const KOD_TRIES = 2

const version = z.string().regex(/^\d+\.\d+\.\d+$/)

export const kodManifest = z.object({
  version,
  kabuk: z.string().min(8),
  file: z.string().regex(/^kod-[\w.-]+\.zip$/),
  sha512: z.string().regex(/^[0-9a-f]{128}$/),
  size: z.number().int().positive()
})
export type KodManifest = z.infer<typeof kodManifest>

export const kodState = z.object({
  version,
  kabuk: z.string().min(8),
  tries: z.number().int().min(0)
})
export type KodState = z.infer<typeof kodState>

export function parseState(raw: string): KodState | null {
  try {
    const parsed = kodState.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function usable(state: KodState | null, bundled: string, kabuk: string): boolean {
  return (
    state !== null &&
    state.kabuk === kabuk &&
    state.tries < KOD_TRIES &&
    newer(state.version, bundled)
  )
}

export function stale(state: KodState, bundled: string, kabuk: string): boolean {
  return state.kabuk !== kabuk || !newer(state.version, bundled)
}

export function offers(
  manifest: KodManifest,
  current: string,
  kabuk: string,
  state: KodState | null
): boolean {
  if (manifest.kabuk !== kabuk || !newer(manifest.version, current)) return false
  return !(state && state.version === manifest.version && state.tries >= KOD_TRIES)
}

export function safeEntry(name: string): boolean {
  if (name.includes('\\') || name.includes(':') || name.startsWith('/')) return false
  const parts = name.split('/')
  if (parts.includes('..') || parts.includes('.')) return false
  return parts[0] === 'out' || parts[0] === 'resources'
}
