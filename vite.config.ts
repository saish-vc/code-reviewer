import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(configDir, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/review': 'http://localhost:7860',
      '/rate': 'http://localhost:7860',
      '/ta-submit': 'http://localhost:7860',
      '/metrics': 'http://localhost:7860',
      '/ta-queue': 'http://localhost:7860',
    },
  },
});
