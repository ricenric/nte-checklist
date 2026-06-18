import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  // This tells Vite to prepend your repo name to all asset links
  base: '/nte-checklist/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});