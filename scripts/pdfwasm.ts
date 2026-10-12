import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

const DIR = resolve('node_modules/pdfjs-dist/wasm')
const FILES = [
  'jbig2.wasm',
  'jbig2_nowasm_fallback.js',
  'openjpeg.wasm',
  'openjpeg_nowasm_fallback.js',
  'qcms_bg.wasm'
]

export function pdfWasm(): Plugin {
  return {
    name: 'quizloop-pdf-wasm',
    generateBundle() {
      for (const f of FILES)
        this.emitFile({
          type: 'asset',
          fileName: `pdfwasm/${f}`,
          source: readFileSync(resolve(DIR, f))
        })
    },
    configureServer(server) {
      server.middlewares.use('/pdfwasm', (req, res, next) => {
        const f = FILES.find((x) => req.url?.split('?')[0] === `/${x}`)
        if (!f) return next()
        res.setHeader('Content-Type', f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript')
        res.end(readFileSync(resolve(DIR, f)))
      })
    }
  }
}
