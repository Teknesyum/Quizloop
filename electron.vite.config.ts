import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { kabuk } from './scripts/kabuk'

const shared = {
  '@core': resolve('src/core'),
  '@shared': resolve('src/shared'),
  '@locale': resolve('locale')
}

export default defineConfig({
  main: {
    resolve: { alias: { '@main': resolve('src/main'), ...shared } },
    define: { __KABUK__: JSON.stringify(kabuk()) },
    build: {
      rollupOptions: {
        input: { index: resolve('src/main/index.ts'), boot: resolve('src/main/boot.ts') }
      }
    }
  },
  preload: {
    resolve: { alias: shared },
    build: { rollupOptions: { output: { format: 'cjs' } } }
  },
  renderer: {
    resolve: { alias: { '@renderer': resolve('src/renderer/src'), ...shared } },
    plugins: [react()]
  }
})
