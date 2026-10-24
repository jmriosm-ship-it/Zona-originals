import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En Netlify (con dominio propio) la página vive en la raíz; en GitHub Pages, dentro de /Zona-originals/.
  // Netlify define la variable NETLIFY al compilar.
  base: process.env.NETLIFY ? '/' : '/Zona-originals/',
})
