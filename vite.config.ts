import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BrowserHooks',
      formats: ['es'],
      fileName: () => 'browser-hooks.js'
    },
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('hooks/use')) {
            if (id.includes('CSS')) return 'css-hooks';
            if (id.includes('Web')) return 'web-hooks';
            if (id.includes('Media')) return 'media-hooks';
            if (id.includes('Device')) return 'device-hooks';
            if (id.includes('File')) return 'file-hooks';
            return 'misc-hooks';
          }
        }
      }
    }
  }
});