import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Brillo suave que sigue al mouse sobre las tarjetas: solo actualiza dos variables CSS del elemento bajo el cursor.
const GLOW = '.card, .path, .step-link, .trust-tile, .gen'
if (window.matchMedia('(hover: hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener(
    'pointermove',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest(GLOW) : null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    },
    { passive: true },
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
