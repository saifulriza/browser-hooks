import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BrowserHooks',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `browser-hooks.${format === 'es' ? 'js' : format === 'cjs' ? 'cjs' : 'umd.js'}`
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    terserOptions: {
      compress: {
        arrows: true,
        arguments: true,
        booleans_as_integers: true,
        booleans: true,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        drop_console: true,
        drop_debugger: true,
        ecma: 2020,
        evaluate: true,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_classnames: false,
        keep_fargs: false,
        keep_fnames: false,
        loops: true,
        module: true,
        negate_iife: true,
        passes: 3,
        properties: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        toplevel: true,
        typeofs: true,
        unused: true
      },
      mangle: {
        eval: true,
        keep_classnames: false,
        keep_fnames: false,
        module: true,
        toplevel: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ecma: 2020,
        wrap_iife: true,
        ascii_only: true
      }
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named'
      }
    }
  }
});