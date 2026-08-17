import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Tauri requires a relative base path so assets resolve correctly
  // inside the webview on all platforms.
  base: './',

  resolve: {
    alias: {
      '@': path.resolve(configDir, './src'),
    },
  },

  // Vite dev server — for local dev with `npm run dev` (no Tauri).
  // In Tauri dev mode (`npm run tauri dev`) the webview opens the
  // Vite dev-server URL defined in tauri.conf.json instead.
  server: {
    port: 1420,
    strictPort: true,
    // Allow the Tauri webview origin in dev
    cors: true,
  },

  // Output directory — Tauri reads `frontendDist` from tauri.conf.json
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  // Expose Vite env vars with VITE_ prefix to the frontend
  envPrefix: ['VITE_'],
});
