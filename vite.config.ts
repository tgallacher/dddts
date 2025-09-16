import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DDDTypeScript',
      fileName: 'index'
    },
    target: 'node18',
    rollupOptions: {
      external: ['fs', 'path', 'crypto']
    }
  },
  test: {
    environment: 'node',
    globals: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})