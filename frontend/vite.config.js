import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, tudo que começa com /api é encaminhado ao backend (sem o prefixo /api).
// Assim o navegador só fala com esta origem e não é preciso configurar CORS.
// Exemplo: fetch('/api/alunos') -> http://localhost:3000/alunos
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
