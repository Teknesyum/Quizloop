import { cpSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const SAMPLES = resolve('resources/ornek')
const BUNDLED = readdirSync(SAMPLES).sort()
const BANNED = /\.(gz|mjs)$/i
const OUT = resolve('out/android')

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

function bundledModules(): Plugin {
  return {
    name: 'quizloop-bundled-modules',
    apply: 'build',
    closeBundle() {
      const index: Record<string, string[]> = {}
      for (const id of BUNDLED) {
        const src = join(SAMPLES, id)
        const files = listFiles(src).map((f) => relative(src, f).split(sep).join('/'))
        const bad = files.filter((f) => BANNED.test(f))
        if (bad.length) throw new Error(`bundled module uses a banned extension: ${bad.join(', ')}`)
        const dest = join(OUT, 'bundled', id)
        mkdirSync(dest, { recursive: true })
        cpSync(src, dest, { recursive: true })
        index[id] = files
      }
      writeFileSync(join(OUT, 'bundled', 'index.json'), JSON.stringify(index))
      const leaked = listFiles(OUT).filter((f) => BANNED.test(f))
      if (leaked.length) throw new Error(`web build has banned extensions: ${leaked.join(', ')}`)
    }
  }
}

export default defineConfig({
  root: resolve('src/android'),
  base: './',
  publicDir: false,
  resolve: {
    alias: [
      {
        find: /^pdfjs-dist\/build\/pdf\.worker\.min\.mjs/,
        replacement: resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')
      },
      {
        find: /^pdfjs-dist$/,
        replacement: resolve('node_modules/pdfjs-dist/legacy/build/pdf.min.mjs')
      },
      { find: '@renderer', replacement: resolve('src/renderer/src') },
      { find: '@core', replacement: resolve('src/core') },
      { find: '@shared', replacement: resolve('src/shared') },
      { find: '@locale', replacement: resolve('locale') }
    ]
  },
  plugins: [react(), bundledModules()],
  build: {
    outDir: OUT,
    emptyOutDir: true,
    target: 'chrome111',
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        assetFileNames: (info) =>
          /\.mjs$/i.test(info.names[0] ?? '')
            ? 'assets/[name]-[hash].js'
            : 'assets/[name]-[hash][extname]'
      }
    }
  }
})
