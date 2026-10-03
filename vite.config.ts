import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built game run from any folder (GitHub Pages, file server, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
