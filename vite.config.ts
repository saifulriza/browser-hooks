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
    target: 'es2020',
    terserOptions: {
      ecma: 2020,
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 3,
        module: true,
        toplevel: true,
        unsafe_math: true,
        unsafe_arrows: true,
        keep_fargs: false,
        unsafe_methods: true,
        pure_getters: true,
        unsafe_proto: true,
        unsafe_undefined: true
      },
      mangle: {
        properties: false,
        module: true,
        keep_classnames: false,
        keep_fnames: false
      },
      format: {
        comments: false,
        ecma: 2020,
        wrap_iife: true,
        beautify: false
      },
      module: true,
      toplevel: true
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: 'es',
        preserveModules: false,
        generatedCode: 'es2015',
        compact: true,
        hoistTransitiveImports: true,
        minifyInternalExports: true
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    }
  }
});