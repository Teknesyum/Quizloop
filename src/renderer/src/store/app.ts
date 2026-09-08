import { create } from 'zustand'
import type { IntegrityReport, ModuleSummary, Settings } from '@shared/ipc'

export type Route =
  | { name: 'library' }
  | { name: 'stats' }
  | { name: 'settings' }
  | { name: 'session'; moduleId: string }

export type ToastKind = 'success' | 'warning' | 'danger'

export interface Toast {
  id: number
  kind: ToastKind
  text: string
  leaving?: boolean
}

interface AppState {
  route: Route
  modules: ModuleSummary[] | null
  settings: Settings | null
  info: { version: string; platform: string; integrity: IntegrityReport } | null
  toasts: Toast[]
  go(route: Route): void
  loadModules(): Promise<void>
  loadSettings(): Promise<void>
  saveSettings(patch: Partial<Settings>): Promise<void>
  loadInfo(): Promise<void>
  toast(kind: ToastKind, text: string): void
  dismiss(id: number): void
}

let seq = 0
const TOAST_MAX = 3
const TOAST_LIFE = 6000
const TOAST_LEAVE = 160

export const useApp = create<AppState>((set, get) => ({
  route: { name: 'library' },
  modules: null,
  settings: null,
  info: null,
  toasts: [],
  go: (route) => set({ route }),
  loadModules: async () => set({ modules: await window.quizloop.module.list() }),
  loadSettings: async () => set({ settings: await window.quizloop.settings.get() }),
  saveSettings: async (patch) => set({ settings: await window.quizloop.settings.set(patch) }),
  loadInfo: async () => set({ info: await window.quizloop.app.info() }),
  toast: (kind, text) => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }].slice(-TOAST_MAX) }))
    if (kind !== 'danger') setTimeout(() => get().dismiss(id), TOAST_LIFE)
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), TOAST_LEAVE)
  }
}))
