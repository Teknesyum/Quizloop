import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, resolve, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const SAMPLES = resolve('resources/ornek')
const BUNDLED = readdirSync(SAMPLES).sort()
const OUT = resolve('out/web')
const VERSION = (JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string })
  .version

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

const web = (from: string, file: string): string => relative(from, file).split(sep).join('/')

function offline(): Plugin {
  return {
    name: 'quizloop-offline',
    apply: 'build',
    closeBundle() {
      const index: Record<string, string[]> = {}
      for (const id of BUNDLED) {
        const src = join(SAMPLES, id)
        const dest = join(OUT, 'bundled', id)
        mkdirSync(dest, { recursive: true })
        cpSync(src, dest, { recursive: true })
        index[id] = listFiles(src).map((f) => web(src, f))
      }
      writeFileSync(join(OUT, 'bundled', 'index.json'), JSON.stringify(index))
      const files = listFiles(OUT)
        .map((f) => web(OUT, f))
        .filter((f) => f !== 'sw.js')
        .sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f).update(readFileSync(join(OUT, f)))
      const list = [
        './',
        ...files.map((f) => `./${f.split('/').map(encodeURIComponent).join('/')}`)
      ]
      const sw = readFileSync(resolve('src/web/sw.js'), 'utf8')
        .replace('__VERSION__', `${VERSION}-${hash.digest('hex').slice(0, 12)}`)
        .replace('__FILES__', JSON.stringify(list))
      writeFileSync(join(OUT, 'sw.js'), sw)
    }
  }
}

export default defineConfig({
  root: resolve('src/web'),
  base: './',
  publicDir: resolve('src/web/public'),
  define: { __APP_VERSION__: JSON.stringify(VERSION) },
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
  plugins: [react(), offline()],
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
  build: {
    outDir: OUT,
    emptyOutDir: true,
    target: 'es2022',
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
