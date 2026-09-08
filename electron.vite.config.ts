import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const shared = { '@shared': resolve('src/shared'), '@locale': resolve('locale') }

export default defineConfig({
  main: {
    resolve: { alias: { '@main': resolve('src/main'), ...shared } }
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
