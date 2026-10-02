import { subtleSha256, type CorePorts } from '@core/ports'

export const BUNDLE_ROOT = '/bundled'

export interface Bundle {
  ports: CorePorts
  roots: string[]
}

export async function loadBundle(): Promise<Bundle> {
  const res = await fetch(`${BUNDLE_ROOT}/index.json`)
  const manifest = res.ok ? ((await res.json()) as Record<string, string[]>) : {}
  const files = new Set<string>()
  const roots: string[] = []
  for (const [dir, list] of Object.entries(manifest)) {
    const root = `${BUNDLE_ROOT}/${dir}`
    roots.push(root)
    for (const f of list) files.add(`${root}/${f}`)
  }
  const ports: CorePorts = {
    readText: async (path) => {
      const r = await fetch(path)
      if (!r.ok) throw new Error(`read failed: ${path}`)
      return r.text()
    },
    exists: async (path) => files.has(path),
    sha256: subtleSha256,
    now: () => new Date()
  }
  return { ports, roots }
}
