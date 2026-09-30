import path from 'node:path'
import type { Loaded } from './rules.ts'

export const TURLER = ['metin', 'gorsel', 'tablo', 'etiket'] as const

export type Tur = (typeof TURLER)[number]

export function asTur(v: Tur | boolean | undefined): Tur {
  if (v === true) return 'gorsel'
  if (!v) return 'metin'
  return v
}

export function parseTur(v: string | undefined, gorsel: boolean): Tur {
  if (v === undefined) return gorsel ? 'gorsel' : 'metin'
  if (!(TURLER as readonly string[]).includes(v))
    throw new Error(`--tur ${TURLER.join(' | ')} olmalı: ${v}`)
  if (gorsel && v !== 'gorsel') throw new Error('--gorsel ile --tur birlikte verilemez')
  return v as Tur
}

export function suffix(tur: Tur): string {
  return tur === 'metin' ? '' : '-' + tur
}

export function cpKey(hash: string, tur: Tur): string {
  return tur === 'metin' ? hash : hash + ':' + tur
}

export function rawDirOf(l: Loaded, tur: Tur): string {
  return path.join(l.buildDir, tur === 'metin' ? 'raw' : 'raw' + tur)
}

export function briefDirOf(l: Loaded, tur: Tur): string {
  if (tur === 'metin') return path.join(l.buildDir, 'briefs')
  if (tur === 'gorsel') return path.join(l.buildDir, 'gorsel')
  return path.join(l.buildDir, 'briefs-' + tur)
}
