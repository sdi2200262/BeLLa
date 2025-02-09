import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import postcssConfig from './postcss.config.js';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  css: {
    postcss: postcssConfig
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  }
}); 