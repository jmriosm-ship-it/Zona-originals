import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En Netlify y Cloudflare Pages (con dominio propio) la página vive en la raíz; en GitHub Pages, dentro de /Zona-originals/.
  // Netlify define NETLIFY y Cloudflare Pages define CF_PAGES al compilar.
  base: process.env.NETLIFY || process.env.CF_PAGES ? '/' : '/Zona-originals/',
})
