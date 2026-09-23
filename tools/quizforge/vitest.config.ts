import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'quizforge',
    root: import.meta.dirname,
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
