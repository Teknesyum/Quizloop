import type { Settings } from '@shared/ipc'

export interface CorePorts {
  readText(path: string): Promise<string>
  exists(path: string): Promise<boolean>
  sha256(text: string): Promise<string>
  now(): Date
}

export interface SettingsStore {
  get(): Settings
  set(patch: Partial<Settings>): Settings | Promise<Settings>
}

export function joinPath(root: string, ...parts: string[]): string {
  const sep = root.includes('\\') && !root.includes('/') ? '\\' : '/'
  const head = root.replace(/[\\/]+$/, '')
  const tail = parts.map((p) => p.replace(/^[\\/]+|[\\/]+$/g, '')).filter(Boolean)
  return [head, ...tail].join(sep)
}

export async function bytesSha256(bytes: BufferSource): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function subtleSha256(text: string): Promise<string> {
  return bytesSha256(new TextEncoder().encode(text))
}
