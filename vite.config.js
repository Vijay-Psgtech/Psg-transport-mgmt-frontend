import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy keeps the API same-origin in dev, so the httpOnly refresh cookie just works
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
