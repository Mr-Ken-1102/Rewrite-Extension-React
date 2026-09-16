import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
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
