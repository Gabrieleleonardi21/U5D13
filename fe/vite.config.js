import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // "@/..." punta a src/, come si aspetta shadcn
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // In sviluppo /api va al backend Spring: niente CORS e nessun URL assoluto nel codice
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
