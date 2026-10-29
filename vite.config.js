import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Al publicar (Cloudflare, Netlify) con dominio propio, la página vive en la raíz.
  // Solo en desarrollo local, o al compilar para GitHub Pages, va dentro de /Zona-originals/.
  base: command === 'build' && !process.env.GITHUB_ACTIONS ? '/' : '/Zona-originals/',
}))
