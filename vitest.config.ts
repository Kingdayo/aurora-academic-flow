import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Since vite.config.ts now exports a function, we need to call it with a mode
// to get the config object.
const viteConfigObject = typeof viteConfig === 'function'
  ? viteConfig({ mode: 'test' }) // or 'development'
  : viteConfig;

export default mergeConfig(viteConfigObject, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
}))