import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Enlace relativo para funcionar en GitHub Pages, Vercel o servidor local
  server: {
    port: 5174,
    host: true
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          jspdf: ['jspdf', 'jspdf-autotable'],
          xlsx: ['xlsx']
        }
      }
    }
  }
});
