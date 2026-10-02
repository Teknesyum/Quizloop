import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

const alias = {
  '@core': resolve('src/core'),
  '@main': resolve('src/main'),
  '@shared': resolve('src/shared'),
  '@renderer': resolve('src/renderer/src'),
  '@locale': resolve('locale')
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'main',
          include: ['src/core/**/*.test.ts', 'src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
          environment: 'node',
          pool: 'forks'
        },
        resolve: { alias }
      },
      {
        test: {
          name: 'renderer',
          include: ['src/renderer/**/*.test.{ts,tsx}'],
          environment: 'jsdom'
        },
        resolve: { alias }
      }
    ]
  }
})
