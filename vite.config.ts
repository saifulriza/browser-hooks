import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BrowserHooks',
      formats: ['es', 'umd'],
      fileName: (format) => `browser-hooks.${format}.js`
    },
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});