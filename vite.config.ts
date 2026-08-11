import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
