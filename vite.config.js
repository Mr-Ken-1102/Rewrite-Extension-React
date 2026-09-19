import { readFileSync } from 'node:fs';
import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'globalThis.__RWA_EXTENSION_VERSION__': JSON.stringify(packageJson.version),
    'globalThis.__RWA_BUILD_COMMIT__': JSON.stringify(process.env.GITHUB_SHA || process.env.RWA_BUILD_COMMIT || 'unknown'),
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'RewriteAssistantReact',
      formats: ['iife'],
      fileName: () => 'rewrite-assistant-react.js',
    },
    rollupOptions: { external: [] },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        dead_code: true,
        unused: true,
        passes: 2,
      },
      format: { comments: false },
    },
  },
});
